import asyncio

from worker.context import Context


async def main() -> None:
    ctx = Context()

    while True:
        ctx.logger.info("Getting keywords list")
        keywords = ctx.bigquery_client.get_keywords_to_ingest(n=500)
        if keywords:
            ctx.logger.info(f"Got {len(keywords)} keywords from keywords_to_ingest")
            from_keywords_to_ingest = True
        else:
            keywords = ctx.bigquery_client.get_oldest_keywords(n=500)
            from_keywords_to_ingest = False

        ctx.logger.info("Querying google ads")
        df = await ctx.ads_client.get_keyword_info(keywords)

        ctx.logger.info(f"Got {len(df)} results, writing in bigquery")
        ctx.bigquery_client.insert_keywords(df, keywords)

        if from_keywords_to_ingest:
            ctx.logger.info("Deleting keywords from keywords_to_ingest")
            ctx.bigquery_client.delete_keywords_to_ingest(keywords)

        ctx.logger.info("Success")


if __name__ == "__main__":
    asyncio.run(main())
