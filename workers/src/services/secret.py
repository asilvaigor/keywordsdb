import base64
import json
import os
from tempfile import NamedTemporaryFile

from google.cloud.secretmanager import SecretManagerServiceClient


class SecretClient:
    def __init__(self) -> None:
        self._envvars: set[str] = {
            "GOOGLE_ADS_JSON_KEY_FILE_PATH",
            "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
            "GOOGLE_ADS_DEVELOPER_TOKEN",
            "CLICKHOUSE_PASSWORD",
            "GCS_ACCESS_KEY_ID",
            "GCS_SECRET_ACCESS_KEY",
        }
        self._client: SecretManagerServiceClient | None = None
        if self._envvars - set(os.environ.keys()):
            self._client = SecretManagerServiceClient()

    def load_secrets(self) -> None:
        for envvar in self._envvars:
            if envvar not in os.environ:
                if envvar == "GOOGLE_ADS_JSON_KEY_FILE_PATH":
                    with NamedTemporaryFile(mode="w", delete=False) as f:
                        k = base64.b64decode(self._get_secret_value("WORKER_SERVICE_ACCOUNT_KEY"))
                        json.dump(json.loads(k), f)
                        os.environ["GOOGLE_ADS_JSON_KEY_FILE_PATH"] = f.name
                else:
                    os.environ[envvar] = self._get_secret_value(envvar)

    def _get_secret_value(self, envvar: str) -> str:
        if envvar in os.environ or self._client is None:
            return os.environ[envvar]
        path = f"projects/keywordsdb-3/secrets/{envvar}/versions/latest"
        response = self._client.access_secret_version(request={"name": path})
        return response.payload.data.decode("UTF-8")
