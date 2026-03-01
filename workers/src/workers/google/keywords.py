import time
from collections.abc import Generator
from datetime import date

import polars as pl
from google.cloud.exceptions import NotFound

from src.services.bigquery import BigQueryClient
from src.services.clickhouse import ClickhouseClient
from src.services.firestore import FirestoreClient
from src.services.logger import get_logger
from src.services.storage import StorageClient

TABLENAME = "keywords"
TMP_TABLENAME = "keywords-tmp"


def insert(client: BigQueryClient, df: pl.DataFrame, query_keywords: list[str]) -> None:
    """
    Insert records into the keywords-tmp table.

    Args:
        df: Polars DataFrame containing the records to insert
        query_keywords: List of keywords used to query the data
    """
    if df.is_empty():
        return

    df = df.with_columns(
        ingested_at=pl.when(pl.col("keyword").is_in(query_keywords)).then(date.today()).otherwise(None),
        updated_at=pl.lit(date.today()),
    ).select(
        "keyword",
        "volume_google",
        "competition_index",
        "volume_history_google",
        "cpc_high",
        "updated_at",
        "ingested_at",
    )

    client.insert(TMP_TABLENAME, df)


def get_oldest_k_keywords(client: ClickhouseClient, k: int) -> Generator[str]:
    """
    Query the keywords table to get the k oldest records based on ingested_at.

    Args:
        k: Number of records to retrieve

    Yields:
        Keywords as strings
    """
    batch_size = 100_000
    offset = 0

    while offset < k:
        current_batch_size = min(batch_size, k - offset)

        query = """
            SELECT keyword
            FROM keywords
            WHERE volume_estimated_google > 2000 AND updated_at < '2026-02-01'
            ORDER BY volume_estimated_google DESC, updated_at ASC
            LIMIT %(batch_size)s OFFSET %(offset)s
        """
        df = client.execute_query(query, params={"batch_size": current_batch_size, "offset": offset})
        assert df is not None
        keywords = df["keyword"].to_list()
        yield from keywords

        offset += current_batch_size
        if len(keywords) < current_batch_size:
            break


def commit(
    client: BigQueryClient,
    storage_client: StorageClient,
    clickhouse_client: ClickhouseClient,
    firestore_client: FirestoreClient,
) -> None:
    """
    Complex method, which will finish ingestion of the latest keywords and update all databases:
    - BigQuery: copies data from keywords_tmp into the keywords table and deletes the keywords_tmp table.
    - Clickhouse: exports the data from BigQuery to cloud storage, then imports it into ClickHouse.
    - Firestore: exports the top keywords from clickhouse to Firestore.
    """

    logger = get_logger()

    def migrate_tmp_table() -> None:
        tmp_tablename = client.get_full_name(TMP_TABLENAME)
        try:
            client.client.get_table(tmp_tablename)
        except NotFound:
            return

        merge_query = f"""
            MERGE `{client.get_full_name(TABLENAME)}` keywords
            USING (
                SELECT
                    keyword,
                    volume_google,
                    competition_index,
                    cpc_high,
                    volume_history_google,
                    updated_at,
                    ingested_at
                FROM `{tmp_tablename}`
                QUALIFY ROW_NUMBER() OVER (PARTITION BY keyword ORDER BY updated_at DESC) = 1
            ) tmp
            ON keywords.keyword = tmp.keyword
            WHEN MATCHED THEN
                UPDATE SET
                    volume_google = tmp.volume_google,
                    competition_index = tmp.competition_index,
                    cpc_high = tmp.cpc_high,
                    volume_history_google = tmp.volume_history_google,
                    updated_at = tmp.updated_at,
                    ingested_at = CASE
                        WHEN tmp.ingested_at IS NULL THEN keywords.ingested_at
                        ELSE tmp.ingested_at
                    END
            WHEN NOT MATCHED THEN
                INSERT (
                    keyword,
                    volume_google,
                    volume_estimated_google,
                    competition_index,
                    cpc_high,
                    volume_history_google,
                    updated_at,
                    ingested_at
                )
                VALUES (
                    tmp.keyword,
                    tmp.volume_google,
                    LEAST(tmp.volume_google, 10000000),  -- cap estimated volume at 10M
                    tmp.competition_index,
                    tmp.cpc_high,
                    tmp.volume_history_google,
                    tmp.updated_at,
                    tmp.ingested_at
                )
        """

        logger.info("Merging keywords_tmp into keywords table")
        merge_job = client.client.query(merge_query)
        merge_job.result()
        client.client.delete_table(tmp_tablename)

    def calculate_estimated_volume() -> None:
        """Calculate estimated google volume. Google keyword planner volumes are bucketed and in case of typos gives
        extremely overestimated volumes.
        This uses a bayesian shrinkage model:
        - Assuming log(real google volume) = log(bing volume) + log (avg ratio google/bing) + noise
        - Assuming real google volume <= google volume (buckets + google groups similar keywords together)
        - We get `log(real google volume) ~ N(log(bing volume) + mu, sigma^2)`
        - Let `m = log(bing volume) + mu`
        - Let `a = (log(google volume) - m) / sigma`
        - pdf(a) = (1 / sqrt(2 * pi)) * exp(-a^2 / 2)
        - cdf(a) = 0.5 * (1 + erf(a / sqrt(2)))

        Then the expected value of log(real google volume) is:
        ```
        E[log(real google volume)] = m - sigma * (pdf(a) / cdf(a))
        ```

        Finally we do an exponential penalty based on the number of special characters in the keyword:
        `exp(-special_char_penalty * count_special_chars(keyword))`
        """
        logger.info("Calculating estimated google volumes")
        update_query = f"""
            DECLARE mu FLOAT64 DEFAULT LOG(30);
            DECLARE sigma FLOAT64 DEFAULT 0.6;
            DECLARE special_char_penalty FLOAT64 DEFAULT 10;

            -- Abramowitz & Stegun rational approximation for erf, max error 1.5e-7.
            -- Binds t = 1/(1 + 0.3275911*|z|) via an inline subquery, then applies Horner's method.
            CREATE TEMP FUNCTION erf_approx(z FLOAT64) AS ((
                SELECT SIGN(z) * (1.0 - t * (0.254829592 + t * (-0.284496736 + t * (
                    1.421413741 + t * (-1.453152027 + t * 1.061405429)
                ))) * EXP(-z * z))
                FROM (SELECT 1.0 / (1.0 + 0.3275911 * ABS(z)) AS t)
            ));

            -- Count non-alphanumeric, non-space characters in a keyword after removing known
            -- exception terms (brand names and common expressions that legitimately contain
            -- special characters such as '+' or '&').
            CREATE TEMP FUNCTION count_special_chars(keyword STRING) AS ((
                SELECT LENGTH(REGEXP_REPLACE(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        LOWER(keyword),
                    'c++', ''), 'tv+', ''), 'care+', ''), 'disney+', ''), 'amc+', ''), 'a9+', ''), 'hbo+', ''),
                    'pro+', ''), 'at&t', ''), 'h&r', ''), 's&p', ''), 'm&t', ''), 'm&a', ''), 'h&m', ''), 'm&m', ''),
                    r'[a-zA-Z0-9 ]', ''
                ))
            ));

            UPDATE `{client.get_full_name("keywords")}`
            SET volume_estimated_google = CAST(ROUND(EXP(
                (LOG(GREATEST(volume_bing, 1)) + mu)
                - sigma * (
                    (1.0 / SQRT(2.0 * ACOS(-1.0))) * EXP(
                        -POW((LOG(volume_google) - LOG(GREATEST(volume_bing, 1)) - mu) / sigma, 2) / 2.0
                    )
                    / NULLIF(0.5 * (1.0 + erf_approx(
                        (LOG(volume_google) - LOG(GREATEST(volume_bing, 1)) - mu) / (sigma * SQRT(2.0))
                    )), 0)
                )
                - special_char_penalty * count_special_chars(keyword)
            )) AS INT64)
            WHERE volume_bing IS NOT NULL;
        """
        update_job = client.client.query(update_query)
        update_job.result()

    def export_to_clickhouse() -> None:
        logger.info("Exporting to cloud storage")
        export_prefix = date.today().isoformat()
        _export_to_gcs(client, storage_client, export_prefix)

        logger.info("Exporting to ClickHouse")
        hmac_keys = storage_client.get_hmac_keys()
        clickhouse_queries = [
            """
                CREATE OR REPLACE TABLE keywords_new (
                    keyword String,
                    volume_google UInt32,
                    volume_bing UInt32,
                    volume_estimated_google UInt32,
                    competition_index Float32,
                    cpc_high Float32,
                    volume_history_google String,
                    is_adult UInt8,
                    updated_at Date,
                    ingested_at Date
                )
                ENGINE MergeTree
                PRIMARY KEY (volume_estimated_google)
                ORDER BY (volume_estimated_google, competition_index);
            """,
            """
                INSERT INTO keywords_new
                SELECT
                    keyword,
                    volume_google,
                    volume_bing,
                    volume_estimated_google,
                    competition_index,
                    cpc_high,
                    base64Encode(volume_history_google) as volume_history_google,
                    is_adult,
                    updated_at,
                    ingested_at
                FROM s3(
                    %(gcs_path)s,
                    %(gcs_access_key_id)s,
                    %(gcs_secret_access_key)s
                );
            """,
            "ALTER TABLE keywords_new ADD INDEX volume_google_idx volume_google TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new ADD INDEX volume_bing_idx volume_bing TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new ADD INDEX ingested_at_idx ingested_at TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new ADD INDEX competition_index_idx(competition_index) TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new ADD INDEX cpc_high_idx(cpc_high) TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new "
            "ADD INDEX keyword_token_idx(keyword) TYPE ngrambf_v1(4, 1024, 1, 0) GRANULARITY 1;",
            "RENAME TABLE keywords TO keywords_old;",
            "RENAME TABLE keywords_new TO keywords;",
            "DROP TABLE keywords_old;",
        ]

        while not clickhouse_client.ping():
            logger.info("Waiting for ClickHouse server to be up...")
            time.sleep(5)
        for query in clickhouse_queries:
            clickhouse_client.execute_query(
                query,
                params={
                    "gcs_path": f"https://storage.googleapis.com/{StorageClient.BUCKET_BACKUP}/{export_prefix}/*.parquet",
                    "gcs_access_key_id": hmac_keys[0],
                    "gcs_secret_access_key": hmac_keys[1],
                },
            )

    def export_to_firestore() -> None:
        logger.info("Exporting top keywords to Firestore")
        df = _get_top_k_rows(clickhouse_client, 100)
        count = _count(clickhouse_client)
        firestore_client.put_keywords_cache(df, count, False)
        df = _get_sample(clickhouse_client, min_volume_estimated_google=10_000_000)
        firestore_client.put_keywords_cache(df, len(df), True)
        storage_client.write_df(df, f"gs://{StorageClient.BUCKET}/keywords-sample/sample.parquet")

    migrate_tmp_table()
    calculate_estimated_volume()
    export_to_clickhouse()
    export_to_firestore()


def _export_to_gcs(client: BigQueryClient, storage_client: StorageClient, prefix: str) -> None:
    extract_query = f"""
        EXPORT DATA OPTIONS(
            uri='gs://{StorageClient.BUCKET_BACKUP}/{prefix}/*.parquet',
            format='PARQUET',
            compression='SNAPPY',
            overwrite=true
        ) AS
        SELECT
            keyword,
            volume_google,
            volume_bing,
            volume_estimated_google,
            competition_index,
            cpc_high,
            volume_history_google,
            is_adult,
            updated_at,
            ingested_at
        FROM `{client.get_full_name(TABLENAME)}`
    """
    export_job = client.client.query(extract_query)
    export_job.result()
    storage_client.write_string(f"gs://{StorageClient.BUCKET_BACKUP}/current", prefix)


def _get_top_k_rows(client: ClickhouseClient, k: int) -> pl.DataFrame:
    df = client.execute_query(
        """
            SELECT
                keyword,
                volume_estimated_google,
                competition_index,
                cpc_high,
                volume_history_google,
                updated_at
            FROM keywords
            WHERE is_adult = FALSE OR is_adult IS NULL
            ORDER BY volume_estimated_google DESC
            LIMIT %(k)s
        """,
        params={"k": k},
    )
    assert df is not None
    return df


def _count(client: ClickhouseClient) -> int:
    df = client.execute_query("SELECT count(*) FROM keywords WHERE is_adult = FALSE OR is_adult IS NULL")
    assert df is not None
    return df[0, 0]


def _get_sample(client: ClickhouseClient, min_volume_estimated_google: int) -> pl.DataFrame:
    df = client.execute_query(
        """
            SELECT
                keyword,
                volume_estimated_google,
                competition_index,
                cpc_high,
                volume_history_google,
                is_adult,
                updated_at
            FROM keywords
            WHERE volume_estimated_google > %(min_volume_estimated_google)s AND (is_adult = FALSE OR is_adult IS NULL)
            ORDER BY volume_estimated_google DESC
        """,
        params={"min_volume_estimated_google": min_volume_estimated_google},
    )
    assert df is not None
    return df
