import asyncio
import multiprocessing

from src.services.bigquery import BigQueryClient
from src.services.storage import StorageClient
from src.workers.bing.context import Context


def export_to_gcs(client: BigQueryClient, storage_client: StorageClient) -> None:
    extract_query = f"""
        EXPORT DATA OPTIONS(
            uri='gs://{StorageClient.BUCKET}/bing-to-ingest/*.parquet',
            format='PARQUET',
            compression='SNAPPY',
            overwrite=true
        ) AS
        SELECT keyword
        FROM `{client.get_full_name("keywords")}`
        WHERE bing_avg_monthly_searches IS NULL AND avg_monthly_searches > 10
        ORDER BY avg_monthly_searches DESC
    """
    export_job = client.client.query(extract_query)
    export_job.result()

    output_files = storage_client.ls(f"gs://{StorageClient.BUCKET}/bing-to-ingest/")
    storage_client.write_json(
        f"gs://{StorageClient.BUCKET}/bing-to-ingest/in_progress.json", {f: 0 for f in output_files}
    )


def merge_to_main_table(client: BigQueryClient) -> None:
    merge_query = f"""
        MERGE `{client.get_full_name("keywords")}` k
        USING `{client.get_full_name("bing-volumes-tmp")}` b
        ON k.keyword = b.keyword
        WHEN MATCHED THEN UPDATE SET bing_avg_monthly_searches = b.avg_monthly_searches;

        UPDATE `{client.get_full_name("keywords")}` k
        SET bing_avg_monthly_searches = 0
        WHERE k.avg_monthly_searches <= 10 AND bing_avg_monthly_searches IS NULL;
    """
    merge_job = client.client.query(merge_query)
    merge_job.result()
    client.delete_table("bing-volumes-tmp")


async def main_async() -> None:
    ctx = Context()

    if not ctx.storage_client.exists("bing-to-ingest/in_progress.json"):
        ctx.logger.info("Exporting keywords to ingest to cloud storage")
        export_to_gcs(ctx.bigquery_client, ctx.storage_client)

    ctx.logger.info("Getting keywords list")
    try:
        file_to_ingest = ctx.storage_client.find(f"gs://{StorageClient.BUCKET}/bing-to-ingest/", ".parquet")
        in_progress: dict[str, int] = ctx.storage_client.read_json(
            f"gs://{StorageClient.BUCKET}/bing-to-ingest/in_progress.json"
        )
    except FileNotFoundError:
        ctx.logger.info("No file to ingest, merging bing volumes to main table")
        merge_to_main_table(ctx.bigquery_client)
        ctx.logger.info("Success")
        exit(1)

    keywords = ctx.storage_client.read_df(file_to_ingest)["keyword"]
    tot_keywords = len(keywords)
    i_min = in_progress[file_to_ingest]
    i_max = min(i_min + 500_000, tot_keywords)

    keywords = keywords[i_min:i_max].to_list()
    ctx.logger.info(f"Got {len(keywords)} keywords to ingest, range=[{i_min},{i_max}], total={tot_keywords}")
    df = await ctx.ads_client.get_keyword_info(keywords)

    ctx.logger.info(f"Inserting {len(df)} rows into BigQuery")
    ctx.bigquery_client.insert("bing-volumes-tmp", df)
    ctx.storage_client.write_json(
        f"gs://{StorageClient.BUCKET}/bing-to-ingest/in_progress.json", {**in_progress, file_to_ingest: i_max}
    )

    if i_max >= tot_keywords:
        ctx.logger.info("Finished ingesting file, deleting it")
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
