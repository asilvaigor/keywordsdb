import os
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


class Keywords:
    tablename = "keywords"
    tmp_tablename = "keywords-tmp"

    @staticmethod
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
            "avg_monthly_searches",
            "competition_index",
            "volume_history",
            "cpc_high",
            "cpc_low",
            "cpc_avg",
            "updated_at",
            "ingested_at",
        )

        client.insert(Keywords.tmp_tablename, df)

    @staticmethod
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
                WHERE avg_monthly_searches > 2000
                ORDER BY ingested_at ASC
                LIMIT %(batch_size)s OFFSET %(offset)s
            """
            df = client.execute_query(query, params={"batch_size": current_batch_size, "offset": offset})
            assert df is not None
            keywords = df.select("keyword").to_series().to_list()
            yield from keywords

            offset += current_batch_size
            if len(keywords) < current_batch_size:
                break

    @staticmethod
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
            tmp_tablename = client.get_full_name(Keywords.tmp_tablename)
            try:
                client.client.get_table(tmp_tablename)
            except NotFound:
                return

            with open(os.path.join(os.path.dirname(__file__), "merge.sql")) as f:
                merge_query = f.read()

            logger.info("Merging keywords_tmp into keywords table")
            merge_job = client.client.query(merge_query)
            merge_job.result()
            client.client.delete_table(tmp_tablename)

        def export_to_clickhouse() -> None:
            logger.info("Exporting to cloud storage")
            export_prefix = "exports"
            export_prefix_today = f"exports/{date.today()}"
            Keywords._export_to_gcs(client, storage_client, export_prefix_today)

            logger.info("Exporting to ClickHouse")
            hmac_keys = storage_client.get_hmac_keys()
            clickhouse_queries = [
                """
                    CREATE OR REPLACE TABLE keywords_new (
                        keyword String,
                        avg_monthly_searches UInt32,
                        competition_index Float32,
                        cpc_high Float32,
                        volume_history String,
                        updated_at Date,
                        ingested_at Date
                    )
                    ENGINE MergeTree
                    PRIMARY KEY (avg_monthly_searches)
                    ORDER BY (avg_monthly_searches, competition_index);
                """,
                """
                    INSERT INTO keywords_new
                    SELECT
                        keyword,
                        avg_monthly_searches,
                        competition_index,
                        cpc_high,
                        volume_history,
                        updated_at,
                        ingested_at
                    FROM s3(
                        %(gcs_path)s,
                        %(gcs_access_key_id)s,
                        %(gcs_secret_access_key)s
                    );
                """,
                "ALTER TABLE keywords_new ADD INDEX ingested_at_idx ingested_at TYPE minmax GRANULARITY 1;",
                "ALTER TABLE keywords_new "
                "ADD INDEX competition_index_idx(competition_index) TYPE minmax GRANULARITY 1;",
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
                        "gcs_path": f"https://storage.googleapis.com/{storage_client.bucket.name}/{export_prefix_today}/*.parquet",
                        "gcs_access_key_id": hmac_keys[0],
                        "gcs_secret_access_key": hmac_keys[1],
                    },
                )

            logger.info("Cleaning cloud storage")
            storage_client.delete_prefix(export_prefix)

        def export_to_firestore() -> None:
            logger.info("Exporting top keywords to Firestore")
            df = Keywords._get_top_k_rows(clickhouse_client, 100)
            count = Keywords._count(clickhouse_client)
            firestore_client.put_keywords_cache(df, count)

        migrate_tmp_table()
        export_to_clickhouse()
        export_to_firestore()

    @staticmethod
    def download(client: BigQueryClient, storage_client: StorageClient, prefix: str) -> None:
        """
        Downloads the keywords table to a parquet file.
        """
        logger = get_logger()
        cloud_prefix = f"exports/{date.today()}"
        logger.info("Exporting keywords table to cloud storage")
        Keywords._export_to_gcs(client, storage_client, cloud_prefix)
        logger.info("Downloading keywords table from cloud storage")
        storage_client.download_prefix(cloud_prefix, prefix)
        logger.info("All files downloaded successfully. Cleaning up...")
        storage_client.delete_prefix(cloud_prefix)
        logger.info("Keywords table downloaded successfully.")

    @staticmethod
    def _export_to_gcs(client: BigQueryClient, storage_client: StorageClient, prefix: str) -> None:
        extract_query = f"""
            EXPORT DATA OPTIONS(
                uri='gs://{storage_client._bucket_name}/{prefix}/*.parquet',
                format='PARQUET',
                compression='SNAPPY',
                overwrite=true
            ) AS
            SELECT * FROM `{client.get_full_name(Keywords.tablename)}`
        """
        export_job = client.client.query(extract_query)
        export_job.result()

    @staticmethod
    def _get_top_k_rows(client: ClickhouseClient, k: int) -> pl.DataFrame:
        df = client.execute_query(
            """
                SELECT
                    keyword,
                    avg_monthly_searches,
                    competition_index,
                    cpc_high,
                    volume_history,
                    updated_at
                FROM keywords
                ORDER BY avg_monthly_searches DESC
                LIMIT %(k)s
            """,
            params={"k": k},
        )
        assert df is not None
        return df

    @staticmethod
    def _count(client: ClickhouseClient) -> int:
        df = client.execute_query("SELECT count(*) FROM keywords")
        assert df is not None
        return df[0, 0]
