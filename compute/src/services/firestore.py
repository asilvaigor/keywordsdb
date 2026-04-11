import hashlib
import os
from collections.abc import Generator
from typing import Literal

import polars as pl
from google.cloud.firestore import Client, DocumentSnapshot


class FirestoreClient:
    keywords_cache = "keywords-cache"
    keywords_counts_cache = "keyword-counts-cache"
    keywords_to_ingest = "keywords-to-ingest"

    def __init__(self, env: Literal["dev", "stg", "prd"] | None = None) -> None:
        self.client: Client = Client(database=f"keywordsdb-{env or os.getenv('ENV', 'dev')}")

    def put_keywords_cache(self, df: pl.DataFrame, count: int, sample: bool) -> None:
        """
        Update the base document in keywords-cache and keywords-counts-cache collections (documents with default
        filters).

        Args:
            df: Polars DataFrame containing query results.
            count: number of results in query.
        """
        # Save in keywords-cache
        hash_value = self.get_cache_doc_id(counts=False, sample=sample)
        doc_ref = self.client.collection(FirestoreClient.keywords_cache).document(hash_value)
        doc_value = {
            "results": df.with_columns(pl.col("updated_at").dt.strftime("%Y-%m-%d")).to_dicts(),
            "expires_at": None,
        }
        doc_ref.set(doc_value)

        # Save in keywords-counts-cache
        hash_value = self.get_cache_doc_id(counts=True, sample=sample)
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
        keywords: list[str] = doc.to_dict()["keywords"]  # ty:ignore[not-subscriptable]
        return doc.id, keywords

    def insert_keywords_to_ingest(self, keywords: Generator[str]) -> None:
        """
        Insert keywords into the keywords-to-ingest collection in Firestore, in chunks of a fixed size.
        Uses Firestore batch writes (max 500 ops per batch) to reduce network round trips.

        Args:
            keywords: List of keywords to insert.
        """
        collection = self.client.collection(FirestoreClient.keywords_to_ingest)

        write_batch = self.client.batch()
        batch_op_count = 0
        keyword_chunk: list[str] = []

        def flush_chunk() -> None:
            nonlocal write_batch, batch_op_count
            if not keyword_chunk:
                return
            doc_ref = collection.document()
            write_batch.set(doc_ref, {"keywords": keyword_chunk})
            batch_op_count += 1
            if batch_op_count >= 10:  # Keep this at 10 otherwise it times out
                write_batch.commit()
                write_batch = self.client.batch()
                batch_op_count = 0

        for keyword in keywords:
            keyword_chunk.append(keyword)
            if len(keyword_chunk) >= 2000:
                flush_chunk()
                keyword_chunk = []

        flush_chunk()

        if batch_op_count > 0:
            write_batch.commit()

    def delete_keywords_to_ingest(self, filepath: str) -> None:
        """
        Deletes a document from the keywords-to-ingest collection based on the provided file path.

        Args:
            filepath: The ID of the document to delete.
        """
        doc_ref = self.client.collection(FirestoreClient.keywords_to_ingest).document(filepath)
        doc_ref.delete()

    def get_cache_doc_id(self, counts: bool, sample: bool) -> str:
        cache_key = (
            f'keywords{"-sample" if sample else ""}-{{"is_adult":false}}-'
            '[{"id":"volume_estimated_google","desc":true}]-'
            "volume_estimated_google,volume_google,competition_index,cpc_high,intent,volume_history_google-1-100"
        )
        cache_key_counts = f'keyword-counts{"-sample" if sample else ""}-{{"is_adult":false}}'
        key = cache_key_counts if counts else cache_key
        return hashlib.sha256(key.encode("utf-8")).hexdigest()

    def copy_document(
        self,
        *,
        source_collection: str,
        dest_collection: str | None = None,
        doc_id: str,
        dest_client: FirestoreClient | None = None,
    ) -> None:
        """
        Copies a document from one collection to another.

        Args:
            source_collection: The name of the source collection.
            dest_client: The FirestoreClient instance of the destination collection.
            dest_collection: The name of the destination collection.
            doc_id: The ID of the document to copy.
        """
        if dest_client is None:
            dest_client = self
        if dest_collection is None:
            dest_collection = source_collection

        source_doc_ref = self.client.collection(source_collection).document(doc_id)
        dest_doc_ref = dest_client.client.collection(dest_collection).document(doc_id)

        doc: DocumentSnapshot = source_doc_ref.get()  # ty:ignore[invalid-assignment]
        dest_doc_ref.set(doc.to_dict())  # ty:ignore[invalid-argument-type]
