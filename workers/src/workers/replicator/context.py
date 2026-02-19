from typing import Literal

from structlog.stdlib import BoundLogger

from src.services.firestore import FirestoreClient
from src.services.logger import get_logger
from src.services.secret import SecretClient
from src.services.storage import StorageClient


class Context:
    def __init__(
        self,
        source_env: Literal["stg", "prd"],
        dest_env: Literal["dev", "stg", "prd"],
        logger: BoundLogger | None = None,
        secret_client: SecretClient | None = None,
    ) -> None:
        self.logger: BoundLogger = logger if logger else get_logger()
        self._secret_client: SecretClient = secret_client if secret_client is not None else SecretClient()
        self._secret_client.load_secrets()

        self.source_storage_client: StorageClient = StorageClient(env=source_env)
        self.source_firestore_client: FirestoreClient = FirestoreClient(env=source_env)
        self.dest_storage_client: StorageClient = StorageClient(env=dest_env)
        self.dest_firestore_client: FirestoreClient = FirestoreClient(env=dest_env)
