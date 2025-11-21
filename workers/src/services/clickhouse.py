import os
import threading
from datetime import datetime, timedelta
from typing import Any

import clickhouse_connect
import polars as pl
from clickhouse_connect.driver.client import Client


class ClickhouseClient:
    def __init__(self) -> None:
        self._client: Client | None = None
        self._last_query_time: datetime | None = None
        self._cleanup_timer: threading.Timer | None = None
        self._lock = threading.Lock()

    def execute_query(self, query: str, params: dict[str, Any] | None = None) -> pl.DataFrame | None:
        """
        Execute a ClickHouse query.
        """
        client = self._get_client()
        result = client.query(query, parameters=params)
        if result.row_count == 0:
            return None
        return pl.from_records(result.result_rows, schema=result.column_names, orient="row")

    def ping(self) -> bool:
        client = self._get_client()
        return client.ping()

    def _get_client(self) -> Client:
        """Get or create the ClickHouse client."""
        with self._lock:
            self._cancel_cleanup()
            if self._client is None:
                self._client = clickhouse_connect.get_client(
                    host="rzfef3333x.us-central1.gcp.clickhouse.cloud",
                    port=8443,
                    username="default",
                    password=os.environ["CLICKHOUSE_PASSWORD"],
                )
            self._last_query_time = datetime.now()
            self._schedule_cleanup()

        return self._client

    def _cancel_cleanup(self) -> None:
        """Cancel any scheduled cleanup."""
        if self._cleanup_timer is not None:
            self._cleanup_timer.cancel()
            self._cleanup_timer = None

    def _schedule_cleanup(self) -> None:
        """Schedule client cleanup after 2 minutes of inactivity."""

        def cleanup() -> None:
            with self._lock:
                if self._last_query_time and datetime.now() - self._last_query_time >= timedelta(minutes=2):
                    if self._client is not None:
                        self._client.close()  # type: ignore[no-untyped-call]
                        self._client = None

        self._cancel_cleanup()
        self._cleanup_timer = threading.Timer(120, cleanup)
        self._cleanup_timer.daemon = True
        self._cleanup_timer.start()
