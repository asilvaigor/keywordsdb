import os
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from pathlib import Path

import polars as pl
from google.cloud.storage import Blob, Bucket, Client


class StorageClient:
    def __init__(self) -> None:
        self._bucket_name = f"keywordsdb-{os.getenv('ENV', 'dev')}"
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
            futures: list[Future] = []
            for blob in blobs:
                local_path = str(Path(prefix) / blob.name)
                future = executor.submit(blob.download_to_filename, local_path)
                futures.append(future)

            for future in as_completed(futures):
                future.result()  # This will raise any exceptions that occurred

    def get_hmac_keys(self) -> tuple[str, str]:
        """Get the HMAC keys for the bucket."""
        return os.environ["GCS_ACCESS_KEY_ID"], os.environ["GCS_SECRET_ACCESS_KEY"]

    def exists(self, path: str) -> bool:
        """Check if a file exists in the bucket."""
        blob = self.bucket.blob(path)
        return blob.exists()

    def touch(self, path: str) -> None:
        """Create an empty file in the bucket."""
        blob = self.bucket.blob(path)
        blob.upload_from_string("")

    def find(self, prefix: str, suffix: str) -> str:
        """Finds a file in the bucket that start with the given prefix and ends with the given suffix."""
        blobs: list[Blob] = self.bucket.list_blobs(prefix=prefix)
        for blob in blobs:
            if blob.name.startswith(prefix) and blob.name.endswith(suffix):
                return blob.name
        raise FileNotFoundError(f"No file found with prefix {prefix}")

    def get_df(self, path: str) -> pl.DataFrame:
        """Get a parquet file from the bucket as a DataFrame."""
        assert path.endswith(".parquet")
        blob = self.bucket.blob(path)
        with blob.open("rb") as f:
            return pl.read_parquet(f)

    def delete(self, path: str) -> None:
        """Delete a file in the bucket."""
        blob = self.bucket.blob(path)
        blob.delete()
