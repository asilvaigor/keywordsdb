import polars as pl
from google.cloud.bigquery import Client, LoadJobConfig, WriteDisposition


class BigQueryClient:
    def __init__(self) -> None:
        self._project_id = "keywordsdb-3"
        self._dataset = "keywords"
        self.client = Client(self._project_id)

    def get_full_name(self, tablename: str) -> str:
        return f"{self._project_id}.{self._dataset}.{tablename}"

    def insert(self, tablename: str, df: pl.DataFrame) -> None:
        """
        Insert records into a table.

        Args:
            tablename: Name of the table
            df: Polars DataFrame containing the records to insert
        """
        if df.is_empty():
            return

        df = df.to_pandas()
        for col in df.columns:
            if df[col].dtype == "datetime64[ns]":
                df[col] = df[col].dt.date

        table_ref = self.client.dataset(self._dataset).table(tablename)
        job_config = LoadJobConfig(write_disposition=WriteDisposition.WRITE_APPEND)
        load_job = self.client.load_table_from_dataframe(df, table_ref, job_config=job_config)
        load_job.result()
