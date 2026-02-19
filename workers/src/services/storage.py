import json
import os
import tempfile
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Literal

import polars as pl
from google.cloud.storage import Blob, Bucket, Client


class StorageClient:
    def __init__(self, env: Literal["dev", "stg", "prd"] | None = None) -> None:
        self._bucket_name = f"keywordsdb-{env or os.getenv('ENV', 'dev')}"
        self.client = Client()
        self.bucket: Bucket = self.client.bucket(self._bucket_name)
        assert self.bucket.exists()

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

    def ls(self, prefix: str) -> list[str]:
        """List all files in the bucket with the given prefix."""
        blobs: list[Blob] = self.bucket.list_blobs(prefix=prefix)
        return [blob.name for blob in blobs]

    def find(self, prefix: str, suffix: str) -> str:
        """Finds a file in the bucket that start with the given prefix and ends with the given suffix."""
        blobs: list[Blob] = self.bucket.list_blobs(prefix=prefix)
        for blob in blobs:
            if blob.name.startswith(prefix) and blob.name.endswith(suffix):
                return blob.name
        raise FileNotFoundError(f"No file found with prefix {prefix} and suffix {suffix}")

    def delete(self, path: str) -> None:
        """Delete a file in the bucket."""
        blob = self.bucket.blob(path)
        blob.delete()

    def read_df(self, path: str) -> pl.DataFrame:
        """Get a parquet file from the bucket as a DataFrame."""
        assert path.endswith(".parquet")
        blob = self.bucket.blob(path)
        with blob.open("rb") as f:
            return pl.read_parquet(f)

    def write_df(self, df: pl.DataFrame, path: str) -> None:
        """Write a DataFrame to a parquet file in the bucket."""
        assert path.endswith(".parquet")
        blob = self.bucket.blob(path)
        with tempfile.NamedTemporaryFile(suffix=".parquet") as tmp_file:
            df.write_parquet(tmp_file.name)
            tmp_file.flush()
            blob.upload_from_filename(tmp_file.name)

    def read_json(self, path: str) -> dict:
        """Read a JSON file from the bucket."""
        blob = self.bucket.blob(path)
        if not blob.exists():
            raise FileNotFoundError(f"File {path} not found in bucket {self._bucket_name}")
        content = blob.download_as_text()
        return json.loads(content)

    def write_json(self, path: str, data: dict) -> None:
        """Write a JSON file to the bucket."""
        blob = self.bucket.blob(path)
        blob.upload_from_string(json.dumps(data), content_type="application/json")

    def copy_blob(
        self, *, source_path: str, dest_path: str | None = None, dest_client: StorageClient | None = None
    ) -> None:
        """Copy a file to another client."""
        if dest_client is None:
            dest_client = self
        if dest_path is None:
            dest_path = source_path

        source_blob = self.bucket.blob(source_path)
        dest_blob = dest_client.bucket.blob(dest_path)
        dest_blob.rewrite(source_blob)
