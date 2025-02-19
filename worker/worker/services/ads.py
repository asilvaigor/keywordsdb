import asyncio
import os
from typing import Iterator

import polars as pl
from asyncer import SoonValue, asyncify, create_task_group
from asynciolimiter import Limiter
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.v18 import GenerateKeywordIdeaResponse, GenerateKeywordIdeaResult, GenerateKeywordIdeasRequest
from google.api_core.exceptions import ResourceExhausted


class AdsClient:
    rate_limiter = Limiter(0.5, max_burst=1)
    backoff: bool = False

    def __init__(self) -> None:
        os.environ["GOOGLE_ADS_USE_PROTO_PLUS"] = "true"
        self._client = GoogleAdsClient.load_from_env()
        self._keyword_plan_idea_service = self._client.get_service("KeywordPlanIdeaService")

    async def get_keyword_info(self, keywords: list[str], min_search_volume: int | None = None) -> pl.DataFrame:
        batches = [keywords[i : i + 20] for i in range(0, len(keywords), 20)]
        df = pl.DataFrame()

        results: list[SoonValue[pl.DataFrame]] = []
        async with create_task_group() as task_group:
            for batch in batches:
                r = task_group.soonify(self._get_keyword_batch_info)(batch, min_search_volume)
                results.append(r)
        df = pl.concat([r.value for r in results]).unique(subset=["keyword"])
        return df

    async def _get_keyword_batch_info(self, keywords: list[str], min_search_volume: int | None) -> pl.DataFrame:
        try:
            request: GenerateKeywordIdeasRequest = self._client.get_type("GenerateKeywordIdeasRequest")
            request.customer_id = os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"]
            request.language = "languageConstants/1000"  # English
            request.keyword_plan_network = self._client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH_AND_PARTNERS
            request.keyword_seed.keywords.extend(keywords)

            await AdsClient.rate_limiter.wait()
            await AdsClient._wait_backoff()
            pager = await asyncify(self._keyword_plan_idea_service.generate_keyword_ideas)(request=request)
            pages: Iterator[GenerateKeywordIdeaResponse] = pager.pages  # type: ignore[assignment]
            results: list[pl.DataFrame] = []
            first_page: bool = True
            while True:
                if first_page:
                    first_page = False
                    page = AdsClient._get_page(pages)
                else:
                    await AdsClient.rate_limiter.wait()
                    await AdsClient._wait_backoff()
                    page = await asyncify(AdsClient._get_page)(pages)

                if page is None:
                    break

                df = AdsClient._parse_results(list(page.results))
                if min_search_volume is not None:
                    df = df.filter(pl.col("avg_monthly_searches") >= min_search_volume)
                results.append(df)

            return pl.concat(results)
        except ResourceExhausted:
            await AdsClient._do_backoff()
            return await self._get_keyword_batch_info(keywords, min_search_volume)

    @staticmethod
    async def _wait_backoff() -> None:
        while AdsClient.backoff:
            await asyncio.sleep(10)

    @staticmethod
    async def _do_backoff() -> None:
        AdsClient.backoff = True
        await asyncio.sleep(30)
        AdsClient.backoff = False

    @staticmethod
    def _get_page(pages: Iterator[GenerateKeywordIdeaResponse]) -> GenerateKeywordIdeaResponse | None:
        try:
            return next(pages)
        except StopIteration:
            return None

    @staticmethod
    def _parse_results(results: list[GenerateKeywordIdeaResult]) -> pl.DataFrame:
        df_keywords = pl.DataFrame(
            [
                {
                    "keyword": r.text,
                    "avg_monthly_searches": r.keyword_idea_metrics.avg_monthly_searches,
                    "competition_index": r.keyword_idea_metrics.competition_index,
                    "cpc_low": r.keyword_idea_metrics.low_top_of_page_bid_micros / 1e6,
                    "cpc_high": r.keyword_idea_metrics.high_top_of_page_bid_micros / 1e6,
                }
                for r in results
            ]
        )

        # df_monthly_search = pl.DataFrame(
        #     sum(
        #         [
        #             [
        #                 {
        #                     "keyword": r.text,
        #                     "date": date(m.year, m.month - 1, 1),
        #                     "avg_monthly_searches": m.monthly_searches,
        #                 }
        #                 for m in r.keyword_idea_metrics.monthly_search_volumes
        #             ]
        #             for r in results
        #         ],
        #         [],
        #     )
        # )
        return df_keywords
