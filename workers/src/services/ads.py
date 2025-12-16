import asyncio
import logging
import os
import zlib
from typing import Iterator, MutableSequence

import polars as pl
from asyncer import SoonValue, asyncify, create_task_group
from asynciolimiter import Limiter
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.ads.googleads.v22.services.services.keyword_plan_idea_service.client import KeywordPlanIdeaServiceClient
from google.ads.googleads.v22.services.types import (
    GenerateKeywordIdeaResponse,
    GenerateKeywordIdeaResult,
    GenerateKeywordIdeasRequest,
)
from google.api_core.exceptions import ResourceExhausted
from structlog.stdlib import BoundLogger


class ResourceExhaustedError(Exception):
    """Raised when Google Ads API requires a delay longer than 1800 seconds"""

    pass


class AdsClient:
    _rate_limiter = Limiter(1, max_burst=1)
    _backoff: bool = False

    def __init__(self, logger: BoundLogger) -> None:
        os.environ["GOOGLE_ADS_USE_PROTO_PLUS"] = "true"
        logging.getLogger("google.ads.googleads.client").setLevel(logging.ERROR)

        self._client = GoogleAdsClient.load_from_env()
        self._keyword_plan_idea_service: KeywordPlanIdeaServiceClient = self._client.get_service(
            "KeywordPlanIdeaService"
        )
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

            results: list[pl.DataFrame] = []
            pages, current_page = await self._fetch_first_page(request)
            while current_page is not None:
                res = current_page.results
                if len(res) > 0:
                    df = AdsClient._parse_results(res, min_search_volume)
                    results.append(df)

                if not current_page.next_page_token:
                    break
                current_page = await self._fetch_next_page(pages)

            return pl.concat(results) if results else None

        except ResourceExhausted as e:
            try:
                details = e.details[0]
                delay_seconds = int("".join(filter(str.isdigit, str(details).split("Retry in")[1].split("seconds")[0])))
            except Exception:
                delay_seconds = 30

            if delay_seconds > 1800:
                self._logger.warning(
                    f"Google Ads API: Resource Exhausted with delay {delay_seconds} seconds (> 1800), exiting"
                )
                raise ResourceExhaustedError(f"Delay required: {delay_seconds} seconds")

            level = logging.WARNING if delay_seconds >= 10 else logging.DEBUG
            self._logger.log(level, f"Google Ads API: Resource Exhausted, wait for {delay_seconds} seconds")
            await self._do_backoff(delay_seconds)
            return await self._get_keyword_batch_info(keywords, min_search_volume)

    async def _fetch_first_page(
        self, request: GenerateKeywordIdeasRequest
    ) -> tuple[Iterator[GenerateKeywordIdeaResponse], GenerateKeywordIdeaResponse | None]:
        await AdsClient._rate_limiter.wait()
        await self._wait_backoff()
        self._logger.debug("Getting first page")
        pager = await asyncify(self._keyword_plan_idea_service.generate_keyword_ideas)(request=request)
        pages: Iterator[GenerateKeywordIdeaResponse] = pager.pages
        return pages, self._get_page(pages)  # First page doesnt need await

    async def _fetch_next_page(
        self, pages: Iterator[GenerateKeywordIdeaResponse]
    ) -> GenerateKeywordIdeaResponse | None:
        await AdsClient._rate_limiter.wait()
        await self._wait_backoff()
        self._logger.debug("Getting next page")
        return await asyncify(self._get_page)(pages)

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

    def _get_page(self, pages: Iterator[GenerateKeywordIdeaResponse]) -> GenerateKeywordIdeaResponse | None:
        try:
            return next(pages)
        except StopIteration:
            return None
        except GoogleAdsException as ex:
            if "INVALID_PAGE_TOKEN" in str(ex.failure):
                self._logger.debug("Invalid page token")
                return None
            raise

    @staticmethod
    def _parse_results(
        results: MutableSequence[GenerateKeywordIdeaResult], min_search_volume: int | None
    ) -> pl.DataFrame:
        """Polars operations apparently slower than python loops, keep it simple"""
        keywords = []
        avg_searches = []
        competition = []
        cpc_high = []
        cpc_low = []
        cpc_avg = []
        volume_history: list[bytes | None] = []

        divisor = 1e6
        for r in results:
            metrics = r.keyword_idea_metrics
            keywords.append(r.text)
            avg_searches.append(metrics.avg_monthly_searches)
            competition.append(metrics.competition_index)
            cpc_high.append(metrics.high_top_of_page_bid_micros / divisor)
            cpc_low.append(metrics.low_top_of_page_bid_micros / divisor)
            cpc_avg.append(metrics.average_cpc_micros / divisor)

            if metrics.monthly_search_volumes:
                volumes = metrics.monthly_search_volumes
                s = f"{volumes[0].year},{volumes[0].month},{','.join(str(m.monthly_searches) for m in volumes)}"
                volume_history.append(zlib.compress(s.encode("utf-8")))
            else:
                volume_history.append(None)

        df = pl.DataFrame(
            {
                "keyword": keywords,
                "avg_monthly_searches": avg_searches,
                "competition_index": competition,
                "cpc_high": cpc_high,
                "cpc_low": cpc_low,
                "cpc_avg": cpc_avg,
                "volume_history": volume_history,
            }
        )
        if min_search_volume is not None:
            df = df.filter(pl.col("avg_monthly_searches") >= min_search_volume)
        return df
