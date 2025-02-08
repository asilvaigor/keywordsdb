from datetime import date

import polars as pl

from worker.context import Context

if __name__ == "__main__":
    ctx = Context()

    ctx.logger.info("Reading oldest keywords")
    keywords = ctx.bigquery_client.get_oldest_keywords(n=1000)

    batches = [keywords[i : i + 20] for i in range(0, len(keywords), 20)]
    dfl = []
    for i, batch in enumerate(batches):
        if i % 10 == 0:
            ctx.logger.info(f"{i} / {len(batches)}")
        dfl.append(ctx.ads_client.get_keyword_info(batch)[0])

    df: pl.DataFrame = pl.concat(dfl)
    ctx.logger.info(f"Done, got {len(df)} results")
    df = df.with_columns(
        ingested_at=pl.when(pl.col("keyword").is_in(keywords)).then(date.today()).otherwise(None),
        updated_at=pl.lit(date.today()),
    ).select("keyword", "avg_monthly_searches", "competition_index", "cpc_high", "updated_at", "ingested_at")

    ctx.logger.info("Writing in bigquery")
    ctx.bigquery_client.insert_keywords(df)
    ctx.logger.info("Success")
