from src.services.firestore import FirestoreClient
from src.workers.replicator.context import Context

if __name__ == "__main__":
    ctx = Context(source_env="prd", dest_env="stg")

    ctx.logger.info("Copying sample.parquet to stg bucket...")
    ctx.source_storage_client.copy_blob(
        dest_client=ctx.dest_storage_client, source_path="keywords-sample/sample.parquet"
    )
    ctx.logger.info("Done")

    ctx.logger.info("Copying keywords cache documents to stg...")
    for counts, sample in [(True, True), (False, True), (True, False), (False, False)]:
        ctx.source_firestore_client.copy_document(
            dest_client=ctx.dest_firestore_client,
            source_collection=FirestoreClient.keywords_cache,
            doc_id=ctx.source_firestore_client.get_cache_doc_id(counts=counts, sample=sample),
        )
    ctx.logger.info("Done")
