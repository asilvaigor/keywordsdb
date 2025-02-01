import base64
import json
import os
from tempfile import NamedTemporaryFile

from google.cloud.secretmanager import SecretManagerServiceClient


class SecretClient:
    def __init__(self) -> None:
        self._client = SecretManagerServiceClient()

    def get_secret_value(self, envvar: str) -> str:
        path = f"projects/keywordsdb-3/secrets/{envvar}/versions/latest"
        response = self._client.access_secret_version(request={"name": path})
        return response.payload.data.decode("UTF-8")


def read_secrets() -> None:
    client = SecretClient()

    if "GOOGLE_ADS_JSON_KEY_FILE_PATH" not in os.environ:
        with NamedTemporaryFile(mode="w", delete=False) as f:
            k = base64.b64decode(client.get_secret_value("WORKER_SERVICE_ACCOUNT_KEY"))
            json.dump(json.loads(k), f)
            os.environ["GOOGLE_ADS_JSON_KEY_FILE_PATH"] = f.name

    for envvar in ["GOOGLE_ADS_LOGIN_CUSTOMER_ID", "GOOGLE_ADS_DEVELOPER_TOKEN"]:
        if envvar not in os.environ:
            os.environ[envvar] = client.get_secret_value(envvar)
