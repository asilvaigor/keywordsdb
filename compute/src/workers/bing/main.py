import asyncio
import multiprocessing

from src.services.bigquery import KeywordsTmpTable
from src.services.clickhouse import ClickhouseClient
from src.services.storage import StorageClient
from src.workers.bing.banned_keywords import update_banned_keywords
from src.workers.bing.context import Context


def export_to_gcs(client: ClickhouseClient, storage_client: StorageClient) -> None:
    count_query = "SELECT count(*) FROM keywords WHERE volume_bing = -1 AND volume_google > 10"
    count = client.execute_query(count_query)
    assert count is not None
    num_partitions = (count[0, 0] // 500_000) + 1

    extract_query = f"""
    INSERT INTO FUNCTION
    s3(
        'https://storage.googleapis.com/{StorageClient.BUCKET}/bing-to-ingest/{{_partition_id}}.parquet',
        '{storage_client.get_hmac_keys()[0]}',
        '{storage_client.get_hmac_keys()[1]}',
        'Parquet'
    )
    PARTITION BY rand() % {num_partitions}
    SELECT
        keyword
    FROM keywords
    WHERE volume_bing = -1 AND volume_google > 10
    ORDER BY volume_google DESC
    """
    client.execute_query(extract_query)

    storage_client.write_json(
        f"gs://{StorageClient.BUCKET}/bing-to-ingest/in_progress.json",
        {f"gs://{StorageClient.BUCKET}/bing-to-ingest/{p}.parquet": 0 for p in range(num_partitions)},
    )


async def main_async() -> None:
    ctx = Context()

    if not ctx.storage_client.exists(f"gs://{StorageClient.BUCKET}/bing-to-ingest/in_progress.json"):
        ctx.logger.info("Exporting keywords to ingest to cloud storage")
        export_to_gcs(ctx.clickhouse_client, ctx.storage_client)

    ctx.logger.info("Getting keywords list")
    try:
        file_to_ingest = ctx.storage_client.find(f"gs://{StorageClient.BUCKET}/bing-to-ingest/", ".parquet")
        in_progress: dict[str, int] = ctx.storage_client.read_json(
            f"gs://{StorageClient.BUCKET}/bing-to-ingest/in_progress.json"
        )
    except FileNotFoundError:
        ctx.logger.info("No file to ingest, updating banned keywords")
        await update_banned_keywords(ctx)
        ctx.logger.info("Success. Deleting in_progress.json to reset state")
        ctx.storage_client.delete(f"gs://{StorageClient.BUCKET}/bing-to-ingest/in_progress.json")
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
    ctx.bigquery_client.insert(KeywordsTmpTable, df)
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
