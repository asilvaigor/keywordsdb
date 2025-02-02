from structlog.stdlib import BoundLogger

from worker.services.ads import AdsClient
from worker.services.logger import get_logger
from worker.services.secret import SecretClient


class Context:
    def __init__(
        self,
        logger: BoundLogger | None = None,
        secret_client: SecretClient | None = None,
        ads_client: AdsClient | None = None,
    ):
        self.logger = logger if logger else get_logger()
        self._secret_client = secret_client if secret_client is not None else SecretClient()
        self._secret_client.load_secrets()

        self.ads_client = ads_client if ads_client is not None else AdsClient()
