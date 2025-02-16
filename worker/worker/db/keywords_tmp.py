from datetime import date

import polars as pl

from worker.services.bigquery import BigQueryClient


class KeywordsTmp:
    tablename = "keywords_tmp"

    @staticmethod
    def insert(client: BigQueryClient, df: pl.DataFrame, query_keywords: list[str]) -> None:
        """
        Insert records into the keywords_tmp table.

        Args:
            df: Polars DataFrame containing the records to insert
            query_keywords: List of keywords used to query the data
        """
        if df.is_empty():
            return

        df = df.with_columns(
            ingested_at=pl.when(pl.col("keyword").is_in(query_keywords)).then(date.today()).otherwise(None),
            updated_at=pl.lit(date.today()),
        ).select("keyword", "avg_monthly_searches", "competition_index", "cpc_high", "updated_at", "ingested_at")

        client.insert(KeywordsTmp.tablename, df)
