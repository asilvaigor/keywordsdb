import os

import clickhouse_connect


class ClickhouseClient:
    def __init__(self) -> None:
        self.client = clickhouse_connect.get_client(
            host="rzfef3333x.us-central1.gcp.clickhouse.cloud",
            port=8443,
            username="default",
            password=os.environ["CLICKHOUSE_PASSWORD"],
        )
