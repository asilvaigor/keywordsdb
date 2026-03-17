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

    client.insert("keywords-banned-tmp", df)


def merge_to_main_table(client: BigQueryClient) -> None:
    merge_query = f"""
        MERGE `{client.get_full_name("keywords")}` k
        USING (
            SELECT
                keyword,
                volume_bing,
                competition_index,
                cpc_high,
                volume_history_google,
                is_adult,
                updated_at,
                ingested_at
            FROM `{client.get_full_name("keywords-banned-tmp")}`
            QUALIFY ROW_NUMBER() OVER (PARTITION BY keyword ORDER BY updated_at DESC) = 1
        ) b
        ON k.keyword = b.keyword
        WHEN MATCHED THEN
            UPDATE SET
                volume_bing = b.volume_bing,
                competition_index = CASE
                    WHEN k.volume_google IS NULL THEN b.competition_index
                    ELSE k.competition_index
                END,
                volume_history_google = CASE
                    WHEN k.volume_google IS NULL THEN b.volume_history_google
                    ELSE k.volume_history_google
                END,
                cpc_high = CASE
                    WHEN k.volume_google IS NULL THEN b.cpc_high
                    ELSE k.cpc_high
                END,
                is_adult = CASE
                    WHEN k.volume_google IS NULL THEN b.is_adult
                    ELSE k.is_adult
                END,
                updated_at = CASE
                    WHEN k.volume_google IS NULL THEN b.updated_at
                    ELSE k.updated_at
                END,
                ingested_at = CASE
                    WHEN k.volume_google IS NULL THEN b.ingested_at
                    ELSE k.ingested_at
                END
        WHEN NOT MATCHED THEN
            INSERT (
                keyword,
                volume_google,
                volume_bing,
                competition_index,
                volume_history_google,
                cpc_high,
                is_adult,
                updated_at,
                ingested_at
            ) VALUES (
                b.keyword,
                NULL,
                b.volume_bing,
                b.competition_index,
                b.volume_history_google,
                b.cpc_high,
                b.is_adult,
                b.updated_at,
                b.ingested_at
            )
    """
    merge_job = client.client.query(merge_query)
    merge_job.result()
    client.delete_table("keywords-banned-tmp")


async def update_banned_keywords(ctx: Context) -> None:
    # TODO: improve this logic, we can find more banned keywords

    seeds = get_google_banned_seeds()
    ctx.logger.info("Fetching banned keyword info from bing")
    df = await ctx.ads_client.get_keyword_info(seeds, include_related=True)
    df = df.filter(pl.col("volume_bing") > 0)

    ctx.logger.info(f"Inserting {len(df)} rows into bigquery")
    insert_banned(ctx.bigquery_client, df, seeds)

    ctx.logger.info("Merging into main table")
    merge_to_main_table(ctx.bigquery_client)

    ctx.logger.info("Done updating banned keywords")
