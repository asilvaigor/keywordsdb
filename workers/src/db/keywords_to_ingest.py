from concurrent.futures import ThreadPoolExecutor, as_completed

import polars as pl

from src.services.storage import StorageClient


class KeywordsToIngest:
    prefix = "keywords-to-ingest"
    CHUNK_SIZE = 2000

    @staticmethod
    def pop(storage: StorageClient) -> tuple[str, list[str]]:
        """
        Read keywords from one of the parquet files in GCS.

        Returns:
            Tuple of (file path, list of keywords)
        """
        filepath = storage.get_first_file(KeywordsToIngest.prefix)
        if not filepath:
            return "", []

        df = storage.read_parquet(filepath)
        return filepath, df["keyword"].to_list()

    @staticmethod
    def insert(storage: StorageClient, keywords: list[str]) -> None:
        """
        Insert keywords into multiple parquet files, 2000 keywords per file.
        Files are uploaded in parallel for better performance.

        Args:
            keywords: List of keywords to insert
        """

        def upload_chunk(storage: StorageClient, chunk: list[str]) -> None:
            """Helper method to upload a single chunk as a parquet file."""
            df = pl.DataFrame({"keyword": chunk})
            storage.write_parquet(df, KeywordsToIngest.prefix)

        chunks = []
        for i in range(0, len(keywords), KeywordsToIngest.CHUNK_SIZE):
            chunk = keywords[i : i + KeywordsToIngest.CHUNK_SIZE]
            chunks.append(chunk)

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(upload_chunk, storage, chunk) for chunk in chunks]
            for future in as_completed(futures):
                future.result()  # This will raise any exceptions that occurred
