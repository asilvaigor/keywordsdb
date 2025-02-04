import polars as pl
from google.cloud.bigquery import Client, LoadJobConfig, WriteDisposition


class BigQueryClient:
    def __init__(self):
        self._project_id = "keywordsdb-3"
        self._dataset = "keywords"
        self._table = "keywords"
        self.client = Client(self._project_id)
        self._table_full = f"{self._project_id}.{self._dataset}.{self._table}"
        self._temp_table_full = f"{self._project_id}.{self._dataset}.{self._table}_temp"

    def get_oldest_keywords(self, n: int) -> pl.DataFrame:
        """
        Query the keywords table to get the N oldest records based on updated_at.

        Args:
            n: Number of records to retrieve

        Returns:
            Polars DataFrame containing the results
        """
        query = f"""
            SELECT *
            FROM `{self._table_full}`
            ORDER BY updated_at ASC
            LIMIT {n}
        """

        rows = self.client.query(query).result()
        return pl.DataFrame([dict(row.items()) for row in rows])

    def insert_keywords(self, df: pl.DataFrame) -> None:
        """
        Insert records into the keywords table.

        Args:
            df: Polars DataFrame containing the records to insert
        """
        if df.is_empty():
            return

        temp_table = f"{self._table}_temp"
        pd_df = df.to_pandas()
        pd_df["updated_at"] = pd_df["updated_at"].dt.date

        job_config = LoadJobConfig(write_disposition=WriteDisposition.WRITE_TRUNCATE)
        temp_table_ref = self.client.dataset(self._dataset).table(temp_table)
        load_job = self.client.load_table_from_dataframe(pd_df, temp_table_ref, job_config=job_config)
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
                    updated_at = tmp.updated_at
            WHEN NOT MATCHED THEN
                INSERT (keyword, avg_monthly_searches, competition_index, cpc_high, updated_at)
                VALUES (keyword, avg_monthly_searches, competition_index, cpc_high, updated_at)
        """

        merge_job = self.client.query(merge_query)
        merge_job.result()
        self.client.delete_table(temp_table_ref, not_found_ok=True)
