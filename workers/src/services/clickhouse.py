import os
from typing import Any

import clickhouse_connect
import polars as pl


class ClickhouseClient:
    def __init__(self) -> None:
        self.client = clickhouse_connect.get_client(
            host="rzfef3333x.us-central1.gcp.clickhouse.cloud",
            port=8443,
            username="default",
            password=os.environ["CLICKHOUSE_PASSWORD"],
        )

    def execute_query(self, query: str, params: dict[str, Any] | None = None) -> pl.DataFrame | None:
        """
        Execute a ClickHouse query.
        """
        result = self.client.query(query, parameters=params)
        if result.row_count == 0:
            return None
        return pl.from_records(result.result_rows, schema=result.column_names, orient="row")
