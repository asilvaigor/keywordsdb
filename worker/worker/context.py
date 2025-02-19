from structlog.stdlib import BoundLogger

from worker.services.ads import AdsClient
from worker.services.bigquery import BigQueryClient
from worker.services.logger import get_logger
from worker.services.secret import SecretClient
from worker.services.storage import StorageClient


class Context:
    def __init__(
        self,
        logger: BoundLogger | None = None,
        secret_client: SecretClient | None = None,
        ads_client: AdsClient | None = None,
        bigquery_client: BigQueryClient | None = None,
        storage_client: StorageClient | None = None,
    ):
        self.logger = logger if logger else get_logger()
        self._secret_client = secret_client if secret_client is not None else SecretClient()
        self._secret_client.load_secrets()

        self.ads_client = ads_client if ads_client is not None else AdsClient()
        self.bigquery_client = bigquery_client if bigquery_client is not None else BigQueryClient()
        self.storage_client = storage_client if storage_client is not None else StorageClient()
