import asyncio

from src.services.ads import ResourceExhaustedError
from src.workers.ingestion.context import Context
from src.workers.ingestion.keywords import Keywords


def commit(ctx: Context) -> None:
    ctx.logger.info("No keywords to ingest, commiting changes")
    Keywords.commit(ctx.bigquery_client, ctx.storage_client, ctx.clickhouse_client, ctx.firestore_client)
    ctx.logger.info("Merge done, getting new keywords to ingest")
    keywords_gen = Keywords.get_oldest_k_keywords(ctx.clickhouse_client, k=1000000)
    ctx.firestore_client.insert_keywords_to_ingest(keywords_gen)


async def main() -> None:
    ctx = Context()

    while True:
        ctx.logger.info("Getting keywords list")
        filepath, keywords = ctx.firestore_client.pop_keywords_to_ingest()
        if len(keywords) == 0:
            commit(ctx)
            continue

        for i in range(0, len(keywords), 2000):
            chunk = keywords[i : i + 2000]

            ctx.logger.info("Querying google ads")
            try:
                df = await ctx.ads_client.get_keyword_info(chunk, min_search_volume=1)
            except ExceptionGroup as eg:
                if any(isinstance(e, ResourceExhaustedError) for e in eg.exceptions):
                    return  # Finish worker, will be restarted on next schedule
                raise

            ctx.logger.info(f"Got {len(df)} results, saving in temp table")
            Keywords.insert(ctx.bigquery_client, df, chunk)

        ctx.logger.info("Deleting keywords_to_ingest firestore doc")
        ctx.firestore_client.delete_keywords_to_ingest(filepath)
        ctx.logger.info("Success")


if __name__ == "__main__":
    asyncio.run(main())
