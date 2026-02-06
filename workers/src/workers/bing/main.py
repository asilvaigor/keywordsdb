import asyncio
import multiprocessing

from src.services.bigquery import BigQueryClient
from src.services.storage import StorageClient
from src.workers.bing.context import Context


def export_to_gcs(client: BigQueryClient, storage_client: StorageClient) -> None:
    extract_query = f"""
        EXPORT DATA OPTIONS(
            uri='gs://{storage_client._bucket_name}/bing-to-ingest/*.parquet',
            format='PARQUET',
            compression='SNAPPY',
            overwrite=true
        ) AS
        SELECT keyword FROM `{client.get_full_name("keywords")}`
    """
    export_job = client.client.query(extract_query)
    export_job.result()
    storage_client.touch("bing-to-ingest/IN_PROGRESS")


async def main_async() -> None:
    ctx = Context()

    if not ctx.storage_client.exists("bing-to-ingest/IN_PROGRESS"):
        ctx.logger.info("Exporting keywords to ingest to cloud storage")
        export_to_gcs(ctx.bigquery_client, ctx.storage_client)

    ctx.logger.info("Getting keywords list")
    file_to_ingest = ctx.storage_client.find("bing-to-ingest/", ".parquet")
    keywords = ctx.storage_client.get_df(file_to_ingest)["keyword"].to_list()
    ctx.logger.info(f"Got {len(keywords)} keywords to ingest")

    df = await ctx.ads_client.get_keyword_info(keywords)

    ctx.logger.info(f"Inserting {len(df)} rows into BigQuery")
    ctx.bigquery_client.insert("bing-volumes-tmp", df)
    ctx.storage_client.delete(file_to_ingest)
    ctx.logger.info("Success")


def main() -> None:
    return asyncio.run(main_async())


if __name__ == "__main__":
    while True:
        # Run each ingestion in a separate process to avoid memory leaks
        p = multiprocessing.Process(target=main)
        p.start()
        p.join()
        if p.exitcode != 0:
            break
