import asyncio

from src.db.keywords import Keywords
from src.db.keywords_to_ingest import KeywordsToIngest
from src.workers.ingestion.context import Context


async def main() -> None:
    ctx = Context()

    while True:
        ctx.logger.info("Getting keywords list")
        filepath, keywords = KeywordsToIngest.pop(ctx.storage_client)
        if len(keywords) == 0:
            ctx.logger.info("No keywords to ingest, commiting changes")
            Keywords.commit(ctx.bigquery_client, ctx.storage_client, ctx.clickhouse_client)
            ctx.logger.info("Merge done, getting new keywords")
            keywords = Keywords.get_oldest(ctx.bigquery_client, n=1000000)
            KeywordsToIngest.insert(ctx.storage_client, keywords)
            break

        for i in range(0, len(keywords), 500):
            chunk = keywords[i : i + 500]

            ctx.logger.info("Querying google ads")
            df = await ctx.ads_client.get_keyword_info(chunk, min_search_volume=1)

            ctx.logger.info(f"Got {len(df)} results, saving in temp table")
            Keywords.insert(ctx.bigquery_client, df, chunk)

        ctx.logger.info("Deleting keywords file")
        ctx.storage_client.delete_file(filepath)
        ctx.logger.info("Success")


if __name__ == "__main__":
    asyncio.run(main())
