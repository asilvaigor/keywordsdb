import time
from datetime import date

import polars as pl
from google.cloud.exceptions import NotFound

from src.services.bigquery import BigQueryClient
from src.services.clickhouse import ClickhouseClient
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
            "updated_at",
            "ingested_at",
        )

        client.insert(Keywords.tmp_tablename, df)

    @staticmethod
    def get_oldest(client: BigQueryClient, n: int) -> list[str]:
        """
        Query the keywords table to get the N oldest records based on ingested_at.

        Args:
            n: Number of records to retrieve

        Returns:
            list of keywords
        """
        query = f"""
            SELECT keyword
            FROM `{client.get_full_name(Keywords.tablename)}`
            -- ORDER BY ingested_at ASC, avg_monthly_searches DESC
            WHERE volume_history IS NULL
            LIMIT {n}
        """

        rows = client.client.query(query).result()
        return [dict(row.items())["keyword"] for row in rows]

    @staticmethod
    def commit(client: BigQueryClient, storage_client: StorageClient, clickhouse_client: ClickhouseClient) -> None:
        """
        Copies data from keywords_tmp into the keywords table and deletes the keywords_tmp table.
        Then exports the data into cloud storage and into clickhouse.
        If keywords_tmp table doesn't exist, this method does nothing.
        """
        logger = get_logger()
        tmp_tablename = client.get_full_name(Keywords.tmp_tablename)
        try:
            client.client.get_table(tmp_tablename)
        except NotFound:
            return

        merge_query = f"""
            MERGE `{client.get_full_name(Keywords.tablename)}` keywords
            USING (
                SELECT
                    keyword,
                    avg_monthly_searches,
                    competition_index,
                    cpc_high,
                    volume_history,
                    updated_at,
                    ingested_at
                FROM `{tmp_tablename}`
                QUALIFY ROW_NUMBER() OVER (PARTITION BY keyword ORDER BY updated_at DESC) = 1
            ) tmp
            ON keywords.keyword = tmp.keyword
            WHEN MATCHED THEN
                UPDATE SET
                    avg_monthly_searches = tmp.avg_monthly_searches,
                    competition_index = tmp.competition_index,
                    cpc_high = tmp.cpc_high,
                    volume_history = tmp.volume_history,
                    updated_at = tmp.updated_at,
                    ingested_at = CASE
                        WHEN tmp.ingested_at IS NULL THEN keywords.ingested_at
                        ELSE tmp.ingested_at
                    END
            WHEN NOT MATCHED THEN
                INSERT (
                    keyword, avg_monthly_searches, competition_index, cpc_high, volume_history, updated_at, ingested_at
                )
                VALUES (
                    keyword, avg_monthly_searches, competition_index, cpc_high, volume_history, updated_at, ingested_at
                )
        """

        logger.info("Merging keywords_tmp into keywords table")
        merge_job = client.client.query(merge_query)
        merge_job.result()
        client.client.delete_table(tmp_tablename)

        logger.info("Exporting to cloud storage")
        export_prefix = f"exports/{date.today()}"
        Keywords._export_to_gcs(client, storage_client, export_prefix)

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
                '{gcs_path:String}',
                '{gcs_access_key_id:String}',
                '{gcs_secret_access_key:String}'
            );
        """,
            "ALTER TABLE keywords_new ADD INDEX ingested_at_idx ingested_at TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new ADD INDEX competition_index_idx(competition_index) TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new ADD INDEX cpc_high_idx(cpc_high) TYPE minmax GRANULARITY 1;",
            "ALTER TABLE keywords_new ADD INDEX keyword_token_idx(keyword) TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1;",
            "RENAME TABLE keywords TO keywords_old, keywords_new TO keywords;",
            "DROP TABLE keywords_old;",
        ]

        while not clickhouse_client.client.ping():
            logger.info("Waiting for ClickHouse server to be up...")
            time.sleep(5)
        for query in clickhouse_queries:
            clickhouse_client.client.command(
                query,
                parameters={
                    "gcs_path": f"gs://{storage_client._bucket_name}/{export_prefix}",
                    "gcs_access_key_id": hmac_keys[0],
                    "gcs_secret_access_key": hmac_keys[1],
                },
            )

        logger.info("Cleaning cloud storage")
        storage_client.delete_prefix(export_prefix)

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
                compression='SNAPPY'
            ) AS
            SELECT * FROM `{client.get_full_name(Keywords.tablename)}`
        """
        export_job = client.client.query(extract_query)
        export_job.result()
