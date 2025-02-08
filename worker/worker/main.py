import asyncio
from datetime import date

import polars as pl
from asyncer import SoonValue, create_task_group

from worker.context import Context


async def main() -> None:
    ctx = Context()

    ctx.logger.info("Getting keywords list")
    keywords = ctx.bigquery_client.get_oldest_keywords(n=500)

    batches = [keywords[i : i + 20] for i in range(0, len(keywords), 20)]
    df = pl.DataFrame()
    ctx.logger.info("Querying google ads")

    results: list[SoonValue[pl.DataFrame]] = []
    async with create_task_group() as task_group:
        for batch in batches:
            r = task_group.soonify(ctx.ads_client.get_keyword_info)(batch)
            results.append(r)
    df = pl.concat([r.value for r in results]).unique(subset=["keyword"])

    ctx.logger.info(f"Done, got {len(df)} results")
    df = df.with_columns(
        ingested_at=pl.when(pl.col("keyword").is_in(keywords)).then(date.today()).otherwise(None),
        updated_at=pl.lit(date.today()),
    ).select("keyword", "avg_monthly_searches", "competition_index", "cpc_high", "updated_at", "ingested_at")

    ctx.logger.info("Writing in bigquery")
    ctx.bigquery_client.insert_keywords(df)
    ctx.logger.info("Success")


if __name__ == "__main__":
    asyncio.run(main())
