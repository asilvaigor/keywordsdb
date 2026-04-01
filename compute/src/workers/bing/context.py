from structlog.stdlib import BoundLogger

from src.services.bigquery import BigQueryClient
from src.services.bing import BingAdsClient
from src.services.clickhouse import ClickhouseClient
from src.services.logger import get_logger
from src.services.secret import SecretClient
from src.services.storage import StorageClient


class Context:
    def __init__(
        self,
        logger: BoundLogger | None = None,
        secret_client: SecretClient | None = None,
        ads_client: BingAdsClient | None = None,
        bigquery_client: BigQueryClient | None = None,
        clickhouse_client: ClickhouseClient | None = None,
        storage_client: StorageClient | None = None,
    ) -> None:
        self.logger: BoundLogger = logger if logger else get_logger()
        self._secret_client: SecretClient = secret_client if secret_client is not None else SecretClient()
        self._secret_client.load_secrets()

        self.ads_client: BingAdsClient = ads_client if ads_client is not None else BingAdsClient(self.logger)
        self.bigquery_client: BigQueryClient = bigquery_client if bigquery_client is not None else BigQueryClient()
        self.clickhouse_client: ClickhouseClient = (
            clickhouse_client if clickhouse_client is not None else ClickhouseClient()
        )
        self.storage_client: StorageClient = storage_client if storage_client is not None else StorageClient()
