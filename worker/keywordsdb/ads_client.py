import os
from datetime import date

import polars as pl
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.v17 import (
    GenerateKeywordIdeaResult,
    GenerateKeywordIdeasRequest,
)


class AdsClient:
    def __init__(self):
        self._client = GoogleAdsClient.load_from_env()
        self._keyword_plan_idea_service = self._client.get_service(
            "KeywordPlanIdeaService"
        )

    def get_keyword_info(
        self, keywords: list[str]
    ) -> tuple[pl.DataFrame, pl.DataFrame]:
        request: GenerateKeywordIdeasRequest = self._client.get_type(
            "GenerateKeywordIdeasRequest"
        )
        request.customer_id = os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"]
        request.language = "languageConstants/1000"  # English
        request.keyword_plan_network = (
            self._client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH_AND_PARTNERS
        )
        request.keyword_seed.keywords.extend(keywords)

        keyword_ideas = self._keyword_plan_idea_service.generate_keyword_ideas(
            request=request
        )
        results: list[GenerateKeywordIdeaResult] = []
        for page in keyword_ideas.pages:
            results.extend(page.results)

        return AdsClient._parse_results(results)

    @staticmethod
    def _parse_results(
        results: list[GenerateKeywordIdeaResult],
    ) -> tuple[pl.DataFrame, pl.DataFrame]:
        df_keywords = pl.DataFrame(
            [
                {
                    "keyword": r.text,
                    "avg_monthly_searches": r.keyword_idea_metrics.avg_monthly_searches,
                    "competition_index": r.keyword_idea_metrics.competition_index,
                    "cpc_low": r.keyword_idea_metrics.low_top_of_page_bid_micros / 1e6,
                    "cpc_high": r.keyword_idea_metrics.high_top_of_page_bid_micros
                    / 1e6,
                }
                for r in results
            ]
        )
        df_monthly_search = pl.DataFrame(
            sum(
                [
                    [
                        {
                            "keyword": r.text,
                            "date": date(m.year, m.month - 1, 1),
                            "avg_monthly_searches": m.monthly_searches,
                        }
                        for m in r.keyword_idea_metrics.monthly_search_volumes
                    ]
                    for r in results
                ],
                [],
            )
        )
        return df_keywords, df_monthly_search
