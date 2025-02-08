import polars as pl
from google.cloud.bigquery import Client, LoadJobConfig, WriteDisposition


class BigQueryClient:
    def __init__(self) -> None:
        self._project_id = "keywordsdb-3"
        self._dataset = "keywords"
        self._table = "keywords"
        self.client = Client(self._project_id)
        self._table_full = f"{self._project_id}.{self._dataset}.{self._table}"
        self._temp_table_full = f"{self._project_id}.{self._dataset}.{self._table}_temp"

    def get_oldest_keywords(self, n: int) -> list[str]:
        """
        Query the keywords table to get the N oldest records based on ingested_at.

        Args:
            n: Number of records to retrieve

        Returns:
            list of keywords
        """
        query = f"""
            SELECT keyword
            FROM `{self._table_full}`
            WHERE avg_monthly_searches > 0
            ORDER BY ingested_at ASC, avg_monthly_searches DESC
            LIMIT {n}
        """

        rows = self.client.query(query).result()
        return [dict(row.items())["keyword"] for row in rows]

    def insert_keywords(self, df: pl.DataFrame) -> None:
        """
        Insert records into the keywords table.

        Args:
            df: Polars DataFrame containing the records to insert
        """
        if df.is_empty():
            return

        temp_table = f"{self._table}_temp"
        df = df.to_pandas()
        df["updated_at"] = df["updated_at"].dt.date
        df["ingested_at"] = df["ingested_at"].dt.date

        job_config = LoadJobConfig(write_disposition=WriteDisposition.WRITE_TRUNCATE)
        temp_table_ref = self.client.dataset(self._dataset).table(temp_table)
        load_job = self.client.load_table_from_dataframe(df, temp_table_ref, job_config=job_config)
        load_job.result()

        merge_query = f"""
            MERGE `{self._table_full}` keywords
            USING `{self._temp_table_full}` tmp
            ON keywords.keyword = tmp.keyword
            WHEN MATCHED THEN
                UPDATE SET
                    avg_monthly_searches = tmp.avg_monthly_searches,
                    competition_index = tmp.competition_index,
                    cpc_high = tmp.cpc_high,
                    updated_at = tmp.updated_at,
                    ingested_at = CASE
                        WHEN tmp.ingested_at IS NULL THEN keywords.ingested_at
                        ELSE tmp.ingested_at
                    END
            WHEN NOT MATCHED THEN
                INSERT (keyword, avg_monthly_searches, competition_index, cpc_high, updated_at, ingested_at)
                VALUES (keyword, avg_monthly_searches, competition_index, cpc_high, updated_at, ingested_at)
        """

        merge_job = self.client.query(merge_query)
        merge_job.result()
        self.client.delete_table(temp_table_ref, not_found_ok=True)
