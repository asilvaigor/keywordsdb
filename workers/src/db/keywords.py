from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path

from google.cloud.exceptions import NotFound

from src.db.keywords_tmp import KeywordsTmp
from src.services.bigquery import BigQueryClient
from src.services.logger import get_logger
from src.services.storage import StorageClient


class Keywords:
    tablename = "keywords"

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
            ORDER BY ingested_at ASC, avg_monthly_searches DESC
            LIMIT {n}
        """

        rows = client.client.query(query).result()
        return [dict(row.items())["keyword"] for row in rows]

    @staticmethod
    def update_from_tmp(client: BigQueryClient) -> None:
        """
        Copies data from keywords_tmp into the keywords table and cleans the keywords_tmp table.
        If keywords_tmp table doesn't exist, this method does nothing.
        """
        tmp_table_name = client.get_full_name(KeywordsTmp.tablename)
        try:
            client.client.get_table(tmp_table_name)
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
                FROM `{tmp_table_name}`
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

        merge_job = client.client.query(merge_query)
        merge_job.result()
        client.client.delete_table(tmp_table_name)

    @staticmethod
    def download(client: BigQueryClient, storage_client: StorageClient, prefix: str) -> None:
        """
        Downloads the keywords table to a parquet file.
        """
        logger = get_logger()
        cloud_prefix = f"exports/{date.today()}"

        # Export table to cloud storage
        extract_query = f"""
            EXPORT DATA OPTIONS(
                uri='gs://{storage_client._bucket_name}/{cloud_prefix}/keywords_*.parquet',
                format='PARQUET',
                compression='SNAPPY'
            ) AS
            SELECT * FROM `{client.get_full_name(Keywords.tablename)}`
        """

        logger.info("Exporting keywords table to cloud storage")
        export_job = client.client.query(extract_query)
        export_job.result()

        logger.info("Export completed. Downloading files...")
        # List exported files and download them in parallel
        cloud_files = storage_client.list_files(cloud_prefix)
        total_files = len(cloud_files)
        logger.info(f"Found {total_files} files to download")

        with ThreadPoolExecutor(max_workers=64) as executor:
            # Submit all download tasks
            futures = []
            for cloud_file in cloud_files:
                filename = Path(cloud_file).name
                local_path = str(Path(prefix) / filename)
                future = executor.submit(storage_client.download_file, cloud_file, local_path)
                futures.append(future)

            completed = 0
            for future in as_completed(futures):
                future.result()  # This will raise any exceptions that occurred
                completed += 1
                if completed % 50 == 0 or completed == total_files:
                    logger.info(f"Downloaded {completed} / {total_files} files")

        logger.info("All files downloaded successfully. Cleaning up...")

        # Clean up cloud storage files in parallel
        with ThreadPoolExecutor(max_workers=32) as executor:
            delete_futures = [executor.submit(storage_client.delete_file, cloud_file) for cloud_file in cloud_files]

            for future in as_completed(delete_futures):
                future.result()  # This will raise any exceptions that occurred

        logger.info("Keywords table downloaded successfully.")
