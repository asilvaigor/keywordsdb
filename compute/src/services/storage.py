import json
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed

import polars as pl
from google.cloud.storage import Blob, Client


class StorageClient:
    BUCKET = f"keywordsdb-{os.getenv('ENV', 'dev')}"
    BUCKET_BACKUP = f"keywordsdb-backup-{os.getenv('ENV', 'dev')}"

    def __init__(self) -> None:
        self.client = Client()

    def delete_prefix(self, prefix: str) -> None:
        """Delete all files in the given prefix."""
        bucket_name, path = self._split_bucket_path(prefix)
        bucket = self.client.bucket(bucket_name)
        blobs: list[Blob] = bucket.list_blobs(prefix=prefix)
        with ThreadPoolExecutor(max_workers=32) as executor:
            delete_futures = [executor.submit(bucket.delete_blob, blob.name) for blob in blobs]

            for future in as_completed(delete_futures):
                future.result()  # This will raise any exceptions that occurred

    def get_hmac_keys(self) -> tuple[str, str]:
        """Get the HMAC keys for the bucket."""
        return os.environ["GCS_ACCESS_KEY_ID"], os.environ["GCS_SECRET_ACCESS_KEY"]

    def exists(self, path: str) -> bool:
        """Check if a file exists in the bucket."""
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        return blob.exists()

    def find(self, prefix: str, suffix: str) -> str:
        """Finds a file in the bucket that start with the given prefix and ends with the given suffix."""
        bucket_name, prefix = self._split_bucket_path(prefix)
        bucket = self.client.bucket(bucket_name)
        blobs: list[Blob] = bucket.list_blobs(prefix=prefix)
        for blob in blobs:
            if blob.name.startswith(prefix) and blob.name.endswith(suffix):
                return f"gs://{bucket_name}/{blob.name}"
        raise FileNotFoundError(f"No file found with prefix {prefix} and suffix {suffix}")

    def delete(self, path: str) -> None:
        """Delete a file in the bucket."""
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        blob.delete()

    def read_bytes(self, path: str) -> bytes:
        """Read a file from the bucket as bytes."""
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        return blob.download_as_bytes()

    def read_df(self, path: str) -> pl.DataFrame:
        """Get a parquet file from the bucket as a DataFrame."""
        assert path.endswith(".parquet")
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        with blob.open("rb") as f:
            return pl.read_parquet(f)

    def write_df(self, df: pl.DataFrame, path: str) -> None:
        """Write a DataFrame to a parquet file in the bucket."""
        assert path.endswith(".parquet")
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        with tempfile.NamedTemporaryFile(suffix=".parquet") as tmp_file:
            df.write_parquet(tmp_file.name)
            tmp_file.flush()
            blob.upload_from_filename(tmp_file.name)

    def read_json(self, path: str) -> dict:
        """Read a JSON file from the bucket."""
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        if not blob.exists():
            raise FileNotFoundError(f"File {path} not found in bucket {bucket_name}")
        content = blob.download_as_text()
        return json.loads(content)

    def write_json(self, path: str, data: dict) -> None:
        """Write a JSON file to the bucket."""
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        blob.upload_from_string(json.dumps(data), content_type="application/json")

    def read_string(self, path: str, backup: bool = False) -> str:
        """Read a string from a file in the bucket."""
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        if not blob.exists():
            raise FileNotFoundError(f"File {path} not found in bucket {bucket_name}")
        return blob.download_as_text()

    def write_string(self, path: str, data: str) -> None:
        """Write a string to a file in the bucket."""
        bucket_name, path = self._split_bucket_path(path)
        bucket = self.client.bucket(bucket_name)
        blob = bucket.blob(path)
        blob.upload_from_string(data, content_type="text/plain")

    def copy_blob(self, *, source_path: str, dest_path: str) -> None:
        """Copy a file to another path."""
        assert source_path != dest_path
        source_bucket_name, source_path = self._split_bucket_path(source_path)
        dest_bucket_name, dest_path = self._split_bucket_path(dest_path)
        source_blob = self.client.bucket(source_bucket_name).blob(source_path)
        dest_blob = self.client.bucket(dest_bucket_name).blob(dest_path)
        dest_blob.rewrite(source_blob)

    def _split_bucket_path(self, path: str) -> tuple[str, str]:
        """Split a bucket path into bucket name and blob name."""
        if not path.startswith("gs://"):
            raise ValueError(f"Invalid bucket path: {path}")
        parts = path[5:].split("/", 1)
        if len(parts) != 2:
            raise ValueError(f"Invalid bucket path: {path}")
        return parts[0], parts[1]
