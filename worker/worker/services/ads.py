import asyncio
import os
import zlib
from typing import Iterator

import polars as pl
from asyncer import SoonValue, asyncify, create_task_group
from asynciolimiter import Limiter
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.v18 import GenerateKeywordIdeaResponse, GenerateKeywordIdeaResult, GenerateKeywordIdeasRequest
from google.api_core.exceptions import ResourceExhausted
from structlog.stdlib import BoundLogger


class AdsClient:
    _rate_limiter = Limiter(0.5, max_burst=1)
    _backoff: bool = False

    def __init__(self, logger: BoundLogger) -> None:
        os.environ["GOOGLE_ADS_USE_PROTO_PLUS"] = "true"
        self._client = GoogleAdsClient.load_from_env()
        self._keyword_plan_idea_service = self._client.get_service("KeywordPlanIdeaService")
        self._logger = logger

    async def get_keyword_info(self, keywords: list[str], min_search_volume: int | None = None) -> pl.DataFrame:
        batches = [keywords[i : i + 20] for i in range(0, len(keywords), 20)]
        df = pl.DataFrame()

        results: list[SoonValue[pl.DataFrame | None]] = []
        async with create_task_group() as task_group:
            for batch in batches:
                r = task_group.soonify(self._get_keyword_batch_info)(batch, min_search_volume)
                results.append(r)
        df = pl.concat([r.value for r in results if r.value is not None]).unique(subset=["keyword"])
        return df

    async def _get_keyword_batch_info(self, keywords: list[str], min_search_volume: int | None) -> pl.DataFrame | None:
        try:
            request: GenerateKeywordIdeasRequest = self._client.get_type("GenerateKeywordIdeasRequest")
            request.customer_id = os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"]
            request.language = "languageConstants/1000"  # English
            request.keyword_plan_network = self._client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH_AND_PARTNERS
            request.keyword_seed.keywords.extend(keywords)
            request.include_adult_keywords = True

            await AdsClient._rate_limiter.wait()
            await self._wait_backoff()
            self._logger.debug("Getting first page")
            pager = await asyncify(self._keyword_plan_idea_service.generate_keyword_ideas)(request=request)
            pages: Iterator[GenerateKeywordIdeaResponse] = pager.pages  # type: ignore[assignment]
            results: list[pl.DataFrame] = []
            first_page: bool = True
            while True:
                if first_page:
                    first_page = False
                    page = AdsClient._get_page(pages)
                else:
                    await AdsClient._rate_limiter.wait()
                    await self._wait_backoff()
                    self._logger.debug("Getting next page")
                    page = await asyncify(AdsClient._get_page)(pages)

                if page is None:
                    break

                res = list(page.results)
                if not res:
                    continue

                df = AdsClient._parse_results(res)
                if min_search_volume is not None:
                    df = df.filter(pl.col("avg_monthly_searches") >= min_search_volume)
                results.append(df)

            return pl.concat(results) if results else None
        except ResourceExhausted as e:
            try:
                details = e.details[0]
                delay_seconds = int("".join(filter(str.isdigit, str(details).split("Retry in")[1].split("seconds")[0])))
            except Exception:
                delay_seconds = 30

            self._logger.warning(f"Google Ads API: Resource Exhausted, wait for {delay_seconds}")
            await self._do_backoff(delay_seconds)
            return await self._get_keyword_batch_info(keywords, min_search_volume)

    async def _wait_backoff(self) -> None:
        if AdsClient._backoff:
            await asyncio.sleep(5)
            await AdsClient._rate_limiter.wait()

    async def _do_backoff(self, delay_seconds: int) -> None:
        AdsClient._backoff = True
        self._logger.debug("Backoff")
        await asyncio.sleep(delay_seconds)
        self._logger.debug("Backoff finished")
        AdsClient._backoff = False

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

        volume_data = []
        for r in results:
            volumes = [m.monthly_searches for m in r.keyword_idea_metrics.monthly_search_volumes]
            if volumes:
                start_year = r.keyword_idea_metrics.monthly_search_volumes[0].year
                start_month = r.keyword_idea_metrics.monthly_search_volumes[0].month
                volume_data.append([start_year, start_month, *volumes])
            else:
                volume_data.append([])

        return df_keywords.with_columns(volume_history=AdsClient._compress_arrays(volume_data))

    @staticmethod
    def _compress_arrays(arrays: list[list[int]]) -> pl.Series:
        """Compress arrays using zlib."""
        # Convert to DataFrame for Polars operations
        return (
            pl.Series(arrays)
            .to_frame("arr")
            .select(
                pl.when(pl.col("arr").list.len() == 0)
                .then(None)
                .otherwise(
                    pl.col("arr")
                    .cast(pl.List(pl.String))
                    .list.join(",")
                    .map_elements(lambda s: zlib.compress(s.encode("utf-8")), return_dtype=pl.Binary)
                )
            )
            .to_series()
        )
