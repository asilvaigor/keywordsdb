import os
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import polars as pl
from google.cloud.storage import Blob, Bucket, Client


class StorageClient:
    def __init__(self) -> None:
        self._bucket_name = "keywordsdb-prd"
        self.client = Client()
        self.bucket: Bucket = self.client.bucket(self._bucket_name)

    def write_parquet(self, df: pl.DataFrame, prefix: str) -> str:
        """Write DataFrame to a parquet file with random name in the given prefix."""
        filename = f"{prefix}/{uuid.uuid4()}.parquet"
        blob = self.bucket.blob(filename)

        with tempfile.NamedTemporaryFile() as tmp:
            df.write_parquet(tmp.name)
            blob.upload_from_filename(tmp.name)

        return f"gs://{self._bucket_name}/{filename}"

    def list_files(self, prefix: str) -> list[str]:
        """List all files in the given prefix."""
        return [f"gs://{self._bucket_name}/{b.name}" for b in self.bucket.list_blobs(prefix=prefix)]

    def get_first_file(self, prefix: str) -> str:
        """Get the first file matching the prefix."""
        blobs = list(self.bucket.list_blobs(prefix=prefix, max_results=1))
        if not blobs:
            return ""
        return f"gs://{self._bucket_name}/{blobs[0].name}"

    def read_parquet(self, path: str) -> pl.DataFrame:
        """Read a parquet file from the given path."""
        blob_name = Path(path).relative_to(f"gs://{self._bucket_name}/")
        blob = self.bucket.blob(str(blob_name))
        with blob.open("rb") as f:
            return pl.read_parquet(f)

    def delete_file(self, path: str) -> None:
        """Delete a file at the given path."""
        blob_name = Path(path).relative_to(f"gs://{self._bucket_name}/")
        self.bucket.delete_blob(str(blob_name))

    def delete_prefix(self, prefix: str) -> None:
        """Delete all files in the given prefix."""
        blobs: list[Blob] = self.bucket.list_blobs(prefix=prefix)
        with ThreadPoolExecutor(max_workers=32) as executor:
            delete_futures = [executor.submit(self.bucket.delete_blob, blob.name) for blob in blobs]

            for future in as_completed(delete_futures):
                future.result()  # This will raise any exceptions that occurred

    def download_file(self, cloud_path: str, local_path: str) -> None:
        """Download a file from cloud storage to local filesystem."""
        blob_name = Path(cloud_path).relative_to(f"gs://{self._bucket_name}/")
        blob = self.bucket.blob(str(blob_name))

        # Create local directory if it doesn't exist
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)

        blob.download_to_filename(local_path)

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
