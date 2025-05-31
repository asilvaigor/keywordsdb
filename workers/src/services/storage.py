import tempfile
import uuid
from pathlib import Path

import polars as pl
from google.cloud.storage import Bucket, Client


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

    def download_file(self, cloud_path: str, local_path: str) -> None:
        """Download a file from cloud storage to local filesystem."""
        blob_name = Path(cloud_path).relative_to(f"gs://{self._bucket_name}/")
        blob = self.bucket.blob(str(blob_name))

        # Create local directory if it doesn't exist
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)

        blob.download_to_filename(local_path)
