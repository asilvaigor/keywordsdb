import asyncio

from worker.context import Context
from worker.db.keywords import Keywords
from worker.db.keywords_tmp import KeywordsTmp
from worker.db.keywords_to_ingest import KeywordsToIngest


async def main() -> None:
    ctx = Context()

    while True:
        ctx.logger.info("Getting keywords list")
        keywords = KeywordsToIngest.pop(ctx.bigquery_client, n=500)
        if len(keywords) == 0:
            ctx.logger.info("Table keywords_to_ingest is empty, merging tables")
            Keywords.update_from_tmp(ctx.bigquery_client)
            ctx.logger.info("Merge done, getting new keywords")
            keywords = Keywords.get_oldest(ctx.bigquery_client, n=100000)
            KeywordsToIngest.insert(ctx.bigquery_client, keywords)
            keywords = keywords[:500]

        ctx.logger.info("Querying google ads")
        df = await ctx.ads_client.get_keyword_info(keywords)

        ctx.logger.info(f"Got {len(df)} results, writing in bigquery")
        KeywordsTmp.insert(ctx.bigquery_client, df, keywords)

        ctx.logger.info("Deleting keywords from keywords_to_ingest")
        KeywordsToIngest.delete(ctx.bigquery_client, keywords)

        ctx.logger.info("Success")


if __name__ == "__main__":
    asyncio.run(main())
