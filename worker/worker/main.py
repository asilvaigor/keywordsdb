import asyncio

from worker.context import Context
from worker.db.keywords import Keywords
from worker.db.keywords_tmp import KeywordsTmp
from worker.db.keywords_to_ingest import KeywordsToIngest


async def main() -> None:
    ctx = Context()

    while True:
        ctx.logger.info("Getting keywords list")
        filepath, keywords = KeywordsToIngest.pop(ctx.storage_client)
        if len(keywords) == 0:
            ctx.logger.info("No keywords to ingest, merging tables")
            Keywords.update_from_tmp(ctx.bigquery_client)
            ctx.logger.info("Merge done, getting new keywords")
            keywords = Keywords.get_oldest(ctx.bigquery_client, n=200000)
            KeywordsToIngest.insert(ctx.storage_client, keywords)
            filepath, keywords = KeywordsToIngest.pop(ctx.storage_client)

        for i in range(0, len(keywords), 500):
            chunk = keywords[i : i + 500]

            ctx.logger.info("Querying google ads")
            df = await ctx.ads_client.get_keyword_info(chunk, min_search_volume=0)

            ctx.logger.info(f"Got {len(df)} results, writing to bigquery")
            KeywordsTmp.insert(ctx.bigquery_client, df, chunk)

        ctx.logger.info("Deleting keywords file")
        KeywordsToIngest.delete(ctx.storage_client, filepath)

        ctx.logger.info("Success")


if __name__ == "__main__":
    asyncio.run(main())
