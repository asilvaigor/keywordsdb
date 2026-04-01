import asyncio
import multiprocessing
import sys

from src.services.google import ResourceExhaustedError
from src.workers.google.context import Context
from src.workers.google.keywords import commit as keywords_commit
from src.workers.google.keywords import get_oldest_k_keywords, insert


def commit(ctx: Context) -> None:
    ctx.logger.info("No keywords to ingest, commiting changes")
    keywords_commit(ctx.bigquery_client, ctx.storage_client, ctx.clickhouse_client, ctx.firestore_client)
    ctx.logger.info("Merge done, getting new keywords to ingest")
    keywords_gen = get_oldest_k_keywords(ctx.clickhouse_client, k=1000000)
    ctx.firestore_client.insert_keywords_to_ingest(keywords_gen)


async def main_async() -> None:
    ctx = Context()

    ctx.logger.info("Getting keywords list")
    filepath, keywords = ctx.firestore_client.pop_keywords_to_ingest()
    if len(keywords) == 0:
        commit(ctx)
        return

    for i in range(0, len(keywords), 2000):
        chunk = keywords[i : i + 2000]

        ctx.logger.info("Querying google ads")
        try:
            df = await ctx.ads_client.get_keyword_info(chunk, min_search_volume=1)
        except ResourceExhaustedError:
            sys.exit(1)  # Exit with code 1 to stop the worker

        ctx.logger.info(f"Got {len(df)} results, saving in temp table")
        insert(ctx.bigquery_client, df, chunk)

    ctx.logger.info("Deleting keywords_to_ingest firestore doc")
    ctx.firestore_client.delete_keywords_to_ingest(filepath)
    ctx.logger.info("Success")


def main() -> None:
    return asyncio.run(main_async())


if __name__ == "__main__":
    while True:
        # Run each ingestion in a separate process to avoid memory leaks
        p = multiprocessing.Process(target=main)
        p.start()

        p.join(timeout=3600)  # 1 hour max
        if p.is_alive():
            p.terminate()
            p.join()

        if p.exitcode != 0:
            break
