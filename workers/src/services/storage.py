import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from google.cloud.storage import Blob, Bucket, Client


class StorageClient:
    def __init__(self) -> None:
        self._bucket_name = "keywordsdb-prd"
        self.client = Client()
        self.bucket: Bucket = self.client.bucket(self._bucket_name)

    def delete_prefix(self, prefix: str) -> None:
        """Delete all files in the given prefix."""
        blobs: list[Blob] = self.bucket.list_blobs(prefix=prefix)
        with ThreadPoolExecutor(max_workers=32) as executor:
            delete_futures = [executor.submit(self.bucket.delete_blob, blob.name) for blob in blobs]

            for future in as_completed(delete_futures):
                future.result()  # This will raise any exceptions that occurred

    def download_prefix(self, prefix: str, local_prefix: str) -> None:
        """Download all files in the given prefix to the local filesystem."""
        blobs: list[Blob] = self.bucket.list_blobs(prefix=prefix)

        # Create local directory if it doesn't exist
        Path(local_prefix).parent.mkdir(parents=True, exist_ok=True)

        with ThreadPoolExecutor(max_workers=64) as executor:
            futures = []
            for blob in blobs:
                local_path = str(Path(prefix) / blob.name)
                future = executor.submit(blob.download_to_filename, local_path)
                futures.append(future)

            for future in as_completed(futures):
                future.result()  # This will raise any exceptions that occurred

    def get_hmac_keys(self) -> tuple[str, str]:
        """Get the HMAC keys for the bucket."""
        return os.environ["GCS_ACCESS_KEY_ID"], os.environ["GCS_SECRET_ACCESS_KEY"]
