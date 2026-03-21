from datetime import date

import polars as pl

from src.services.bigquery import BigQueryClient
from src.workers.bing.adult_classifier import is_adult
from src.workers.bing.context import Context


def get_google_banned_seeds() -> list[str]:
    return [
        "biden",
        "bolsonaro",
        "democrat",
        "donald trump",
        "joe biden",
        "lula",
        "maduro",
        "rape",
        "republican",
        "trump",
    ]


def insert_banned(client: BigQueryClient, df: pl.DataFrame, query_keywords: list[str]) -> None:
    """
    Insert records into the keywords-banned-tmp table.

    Args:
        df: Polars DataFrame containing the records to insert
        query_keywords: List of keywords used to query the data
    """
    if df.is_empty():
        return

    df = df.with_columns(
        is_adult=is_adult("keyword"),
        ingested_at=pl.when(pl.col("keyword").is_in(query_keywords)).then(date.today()).otherwise(None),
        updated_at=pl.lit(date.today()),
    ).select(
        "keyword",
        "volume_bing",
        "competition_index",
        "volume_history_google",
        "cpc_high",
        "is_adult",
        "updated_at",
        "ingested_at",
    )

    client.insert("keywords-tmp", df)


async def update_banned_keywords(ctx: Context) -> None:
    # TODO: improve this logic, we can find more banned keywords

    seeds = get_google_banned_seeds()
    ctx.logger.info("Fetching banned keyword info from bing")
    df = await ctx.ads_client.get_keyword_info(seeds, include_related=True)
    df = df.filter(pl.col("volume_bing") > 0)

    ctx.logger.info(f"Inserting {len(df)} rows into bigquery")
    insert_banned(ctx.bigquery_client, df, seeds)

    ctx.logger.info("Done updating banned keywords")
