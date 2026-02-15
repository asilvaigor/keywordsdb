import hashlib
import os
from collections.abc import Generator

import polars as pl
from google.cloud.firestore import Client, DocumentSnapshot


class FirestoreClient:
    keywords_cache = "keywords-cache"
    keywords_counts_cache = "keyword-counts-cache"
    keywords_to_ingest = "keywords-to-ingest"

    def __init__(self) -> None:
        self.client: Client = Client(database=f"keywordsdb-{os.getenv('ENV', 'dev')}")

    def put_keywords_cache(self, df: pl.DataFrame, count: int, sample: bool) -> None:
        """
        Update the base document in keywords-cache and keywords-counts-cache collections (documents with default
        filters).

        Args:
            df: Polars DataFrame containing query results.
            count: number of results in query.
        """
        if sample:
            cache_key = (
                'keywords-{"avg_monthly_searches":{"gte":100000000}}-[{"id":"avg_monthly_searches","desc":true}]-1-100'
            )
            counts_cache_key = 'keyword-counts-{"avg_monthly_searches":{"gte":100000000}}'
        else:
            cache_key = 'keywords-{}-[{"id":"avg_monthly_searches","desc":true}]-1-100'
            counts_cache_key = "keyword-counts-{}"

        # Save in keywords-cache
        hash_value = hashlib.sha256(cache_key.encode("utf-8")).hexdigest()
        doc_ref = self.client.collection(FirestoreClient.keywords_cache).document(hash_value)
        doc_value = {
            "results": df.with_columns(pl.col("updated_at").dt.strftime("%Y-%m-%d")).to_dicts(),
            "expires_at": None,
        }
        doc_ref.set(doc_value)

        # Save in keywords-counts-cache
        hash_value = hashlib.sha256(counts_cache_key.encode("utf-8")).hexdigest()
        doc_ref = self.client.collection(FirestoreClient.keywords_counts_cache).document(hash_value)
        doc_ref.set({"count": count, "expires_at": None})

    def pop_keywords_to_ingest(self) -> tuple[str, list[str]]:
        """
        Pops the first file from the keywords-to-ingest collection and returns its path and keywords.

        Returns:
            A tuple containing the file path and a list of keywords.
        """
        docs: Generator[DocumentSnapshot] = self.client.collection(FirestoreClient.keywords_to_ingest).stream()

        doc = next(docs, None)
        if doc is None:
            return "", []

        docs.close()
        keywords: list[str] = doc.to_dict()["keywords"]
        return doc.id, keywords

    def insert_keywords_to_ingest(self, keywords: Generator[str]) -> None:
        """
        Insert keywords into the keywords-to-ingest collection in Firestore, in chunks of a fixed size.

        Args:
            keywords: List of keywords to insert.
        """
        chunk_size = 2000
        collection = self.client.collection(FirestoreClient.keywords_to_ingest)
        batch = []
        for keyword in keywords:
            batch.append(keyword)
            if len(batch) >= chunk_size:
                collection.add({"keywords": batch})
                batch = []
        if batch:
            collection.add({"keywords": batch})

    def delete_keywords_to_ingest(self, filepath: str) -> None:
        """
        Deletes a document from the keywords-to-ingest collection based on the provided file path.

        Args:
            filepath: The ID of the document to delete.
        """
        doc_ref = self.client.collection(FirestoreClient.keywords_to_ingest).document(filepath)
        doc_ref.delete()
