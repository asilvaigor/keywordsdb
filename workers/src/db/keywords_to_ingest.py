import polars as pl

from src.services.storage import StorageClient


class KeywordsToIngest:
    CHUNK_SIZE = 2000

    @staticmethod
    def pop(storage: StorageClient) -> tuple[str, list[str]]:
        """
        Read keywords from one of the parquet files in GCS.

        Returns:
            Tuple of (file path, list of keywords)
        """
        filepath = storage.get_first_file("keywords-to-ingest")
        if not filepath:
            return "", []

        df = storage.read_parquet(filepath)
        return filepath, df["keyword"].to_list()

    @staticmethod
    def insert(storage: StorageClient, keywords: list[str]) -> None:
        """
        Insert keywords into multiple parquet files, 500 keywords per file.

        Args:
            keywords: List of keywords to insert
        """
        for i in range(0, len(keywords), KeywordsToIngest.CHUNK_SIZE):
            chunk = keywords[i : i + KeywordsToIngest.CHUNK_SIZE]
            df = pl.DataFrame({"keyword": chunk})
            storage.write_parquet(df, "keywords")
