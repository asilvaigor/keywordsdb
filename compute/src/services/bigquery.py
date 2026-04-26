import tempfile

import polars as pl
from google.cloud.bigquery import Client, CreateDisposition, LoadJobConfig, SchemaField, WriteDisposition


class Table:
    name: str
    schema: dict[str, pl.DataType]

    @classmethod
    def fill_missing_columns(cls, df: pl.DataFrame) -> pl.DataFrame:
        for col, dtype in cls.schema.items():
            if col not in df.columns:
                df = df.with_columns(pl.lit(None).cast(dtype).alias(col))
        return df.select(list(cls.schema.keys()))


class KeywordsTable(Table):
    name = "keywords"
    schema = {
        "keyword": pl.String,
        "volume_google": pl.Int64,
        "volume_bing": pl.Int64,
        "volume_estimated_google": pl.Int64,
        "volume_history_google": pl.Binary,
        "cpc_high": pl.Float64,
        "competition_index": pl.Int64,
        "is_adult": pl.Boolean,
        "is_comparison": pl.Boolean,
        "is_branded": pl.Boolean,
        "is_question": pl.Boolean,
        "intent": pl.String,
        "entity_type": pl.String,
        "saas_potential": pl.Float64,
        "updated_at": pl.Date,
        "ingested_at": pl.Date,
    }


class KeywordsTmpTable(Table):
    name = "keywords-tmp"
    schema = {
        "keyword": pl.String,
        "volume_google": pl.Int64,
        "volume_bing": pl.Int64,
        "volume_history_google": pl.Binary,
        "cpc_high": pl.Float64,
        "competition_index": pl.Int64,
        "is_adult": pl.Boolean,
        "is_comparison": pl.Boolean,
        "is_branded": pl.Boolean,
        "is_question": pl.Boolean,
        "intent": pl.String,
        "entity_type": pl.String,
        "saas_potential": pl.Float64,
        "updated_at": pl.Date,
        "ingested_at": pl.Date,
    }


class BigQueryClient:
    def __init__(self) -> None:
        self._project_id = "keywordsdb-3"
        self._dataset = "keywords"
        self.client: Client = Client(self._project_id)

    def get_full_name(self, tablename: str) -> str:
        return f"{self._project_id}.{self._dataset}.{tablename}"

    def delete_table(self, tablename: str) -> None:
        table_ref = self.client.dataset(self._dataset).table(tablename)
        self.client.delete_table(table_ref, not_found_ok=True)

    def insert(self, table: type[Table], df: pl.DataFrame) -> None:
        """
        Insert records into a table. Creates the table if it doesn't exist yet.

        Args:
            table: Table class
            df: Polars DataFrame containing the records to insert
        """
        if df.is_empty():
            return

        df = table.fill_missing_columns(df)
        schema = self._create_schema(df)
        table_ref = self.client.dataset(self._dataset).table(table.name)

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
            elif str(dtype) in ["Int64", "Int32"]:
                field_type = "INTEGER"
            elif str(dtype) in ["Float64", "Float32"]:
                field_type = "FLOAT"
            elif str(dtype) == "Binary":
                field_type = "BYTES"
            elif str(dtype) == "Boolean":
                field_type = "BOOLEAN"
            else:
                field_type = "STRING"

            schema.append(SchemaField(field_name, field_type, "NULLABLE"))
        return schema
