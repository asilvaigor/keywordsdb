import tempfile

import polars as pl
from google.cloud.bigquery import Client, CreateDisposition, LoadJobConfig, SchemaField, WriteDisposition


class BigQueryClient:
    def __init__(self) -> None:
        self._project_id = "keywordsdb-3"
        self._dataset = "keywords"
        self.client = Client(self._project_id)

    def get_full_name(self, tablename: str) -> str:
        return f"{self._project_id}.{self._dataset}.{tablename}"

    def insert(self, tablename: str, df: pl.DataFrame) -> None:
        """
        Insert records into a table. Creates the table if it doesn't exist yet.

        Args:
            tablename: Name of the table
            df: Polars DataFrame containing the records to insert
        """
        if df.is_empty():
            return

        schema = self._create_schema(df)
        table_ref = self.client.dataset(self._dataset).table(tablename)

        with tempfile.NamedTemporaryFile(suffix=".parquet") as tmp:
            df.write_parquet(tmp.name)

            job_config = LoadJobConfig(
                create_disposition=CreateDisposition.CREATE_IF_NEEDED,
                write_disposition=WriteDisposition.WRITE_APPEND,
                schema=schema,
                source_format="PARQUET",
            )

            with open(tmp.name, "rb") as source_file:
                load_job = self.client.load_table_from_file(source_file, table_ref, job_config=job_config)
                load_job.result()

    def _create_schema(self, df: pl.DataFrame) -> list[SchemaField]:
        """
        Create BigQuery schema based on DataFrame columns.
        """
        schema = []
        for col in df.schema.items():
            field_name = col[0]
            dtype = col[1]

            if str(dtype) == "Date":
                field_type = "DATE"
            elif str(dtype) == "Int64":
                field_type = "INTEGER"
            elif str(dtype) == "Float64":
                field_type = "FLOAT"
            elif str(dtype) == "Binary":
                field_type = "BYTES"
            else:
                field_type = "STRING"

            if field_name in ("ingested_at", "volume_history"):
                schema.append(SchemaField(field_name, field_type))
            else:
                schema.append(SchemaField(field_name, field_type, "REQUIRED"))
        return schema
