import asyncio
import logging
import os
from typing import Any

import polars as pl
from asynciolimiter import Limiter
from bingads import AuthorizationData, OAuthWebAuthCodeGrant
from bingads.service_client import ServiceClient
from structlog.stdlib import BoundLogger


class BingAdsClient:
    """
    Client for Microsoft AdInsight API, used to fetch keyword data from Bing Ads.

    This thing was a bit of back engineering to write. Documentations are quite bad and microsoft really doesn't want
    you to use this API. It will ban the account after a few hours of creation, and it is a manual process to recreate
    the account to get a new client id. I've tried going through verifications/appeals multiple times but it does not
    work.

    It needs 4 secrets to work: BING_DEVELOPER_TOKEN, BING_ACCOUNT_ID, BING_CLIENT_ID and BING_REFRESH_TOKEN.
    - BING_ACCOUNT_ID: obtained by creating a new account in ads.microsoft.com. Fill up the mandatory fields, put the
    options that do not create a marketing campaign, and skip the payment section. Once logged in, this is the "aid"
    field in the url.
    - BING_DEVELOPER_TOKEN: also obtained in ads.microsoft.com, in settings / developer you can create a token.
    - BING_CLIENT_ID: A bit tricky, you need to go in azure and create a new app registration. You have to follow more
    or less this tutorial: https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth-register?view=bingads-13
    - BING_REFRESH_TOKEN: To get this one, you need to call get_oauth_link() method, visit the URL, then copy the URL
    that you are redirected to, and call get_refresh_token() with that URL. Then get the token that is in the output URL

    After this is setup it works. But the account will be banned after a few hours. You can sign up for a new account on
    the same email, and then get a new BING_ACCOUNT_ID. This is the only thing that needs to be changed, the other 3
    secrets should still work and only need to be set up once.

    For keywordsdb re-ban:
    - Go on this link https://ads.microsoft.com/cc/Settings/Account
    - Setup new account on i.a.silva@hotmail.com
    - Fill up the mandatory fields, put the options that do not create a marketing campaign, skip the payment section
    - Once logged in, get BING_ACCOUNT_ID from "aid" field in the url, and update the secret
    """

    _rate_limiter = Limiter(40, max_burst=1)

    def __init__(self, logger: BoundLogger) -> None:
        self._oauth: OAuthWebAuthCodeGrant = OAuthWebAuthCodeGrant(
            client_id=os.environ["BING_CLIENT_ID"],
            client_secret=None,
            redirection_uri="https://login.microsoftonline.com/common/oauth2/nativeclient",
        )

        refresh_token = os.environ.get("BING_REFRESH_TOKEN")
        if refresh_token:
            self._oauth.request_oauth_tokens_by_refresh_token(refresh_token)

        self._authorization_data: AuthorizationData = AuthorizationData(
            developer_token=os.environ["BING_DEVELOPER_TOKEN"],
            authentication=self._oauth,
            account_id=os.environ["BING_ACCOUNT_ID"],
        )
        self._adinsight_service: ServiceClient = ServiceClient(
            service="AdInsightService", version=13, authorization_data=self._authorization_data
        )
        self._logger = logger
        logging.getLogger("suds").setLevel(logging.ERROR)

    async def get_keyword_info(self, keywords: list[str]) -> pl.DataFrame:
        if not self._oauth.oauth_tokens.refresh_token:
            raise ValueError("Refresh token is not set. Please authenticate first.")
        if len(keywords) == 0:
            return pl.DataFrame()

        cnt_before = len(keywords)
        keywords = [keyword for keyword in keywords if len(keyword) <= 100]  # 100 characters limit
        keywords_long = [keyword for keyword in keywords if len(keyword) > 100]
        cnt_after = len(keywords)
        if cnt_before != cnt_after:
            self._logger.warning(
                f"Found {cnt_before - cnt_after} keywords that exceed 100 characters limit, setting their volume to 0"
            )

        batches: list[list[str]] = [keywords[i : i + 500] for i in range(0, len(keywords), 500)]
        tasks = [self._get_keyword_batch_info(batch) for batch in batches]
        results: list[pl.DataFrame] = await asyncio.gather(*tasks)

        df = pl.concat(results).unique(subset=["keyword"])
        if len(keywords_long) > 0:
            df = pl.concat([df, pl.DataFrame({"keyword": keywords_long, "avg_monthly_searches": 0})])
        return df

    async def _get_keyword_batch_info(self, keywords: list[str]) -> pl.DataFrame:
        if len(keywords) > 500:
            raise ValueError("Maximum 500 keywords are allowed per request.")
        if any(len(keyword) > 100 for keyword in keywords):
            raise ValueError("All keywords must be 100 characters or less.")

        await BingAdsClient._rate_limiter.wait()

        self._logger.debug(f"Fetching Bing keyword data for {len(keywords)} keywords")
        search_parameters, ideas_attributes = self._setup_arguments(keywords)
        response = await asyncio.to_thread(
            self._adinsight_service.GetKeywordIdeas,
            IdeaAttributes=ideas_attributes,
            SearchParameters=search_parameters,
        )

        out = []
        for k in response.KeywordIdea:
            keyword = k["Keyword"]
            monthly_search_counts = k["MonthlySearchCounts"]
            if monthly_search_counts is not None:
                out.append(
                    {
                        "keyword": keyword,
                        # "volume_history": monthly_search_counts[0],
                        "avg_monthly_searches": monthly_search_counts[0][-1],
                    }
                )
            else:
                out.append({"keyword": keyword, "avg_monthly_searches": 0})

        df = pl.DataFrame(out)
        if set(keywords) != set(df["keyword"].to_list()):
            # I think there's a concurrency issue in bing ads package, the inputs get switched up and we might miss some
            # responses. It does not seem to happen very often, so doing this retry approach.
            self._logger.warning("Input keywords do not match output keywords. Retrying...")
            return await self._get_keyword_batch_info(keywords)
        return df

    def get_oauth_link(self) -> str:
        """
        To get a refresh_token, a manual authorization is required. Call this method, visit the URL, then copy the URL
        that you are redirected to, and call get_refresh_token() with that URL.

        Returns:
            OAuth authorization URL.
        """
        authorization_url = self._oauth.get_authorization_endpoint()
        return authorization_url

    def get_refresh_token(self, response_uri: str) -> str:
        """Gets refresh token given the url with an oauth code.

        Args:
            response_uri: url like 'https://login.microsoftonline.com/common/oauth2/nativeclient?code=...'

        Returns:
            Refresh token to be stored in a secret.
        """
        oauth_tokens = self._oauth.request_oauth_tokens_by_response_uri(response_uri)
        return oauth_tokens.refresh_token

    def _setup_arguments(self, keywords: list[str]) -> tuple[Any, Any]:  # noqa: ANN401
        search_parameters = self._adinsight_service.factory.create("ArrayOfSearchParameter")

        query_search_parameter = self._adinsight_service.factory.create("QuerySearchParameter")
        queries = self._adinsight_service.factory.create("ns1:ArrayOfstring")
        queries.string.extend(keywords)
        query_search_parameter.Queries = queries

        language_search_parameter = self._adinsight_service.factory.create("LanguageSearchParameter")
        languages = self._adinsight_service.factory.create("ArrayOfLanguageCriterion")
        language = self._adinsight_service.factory.create("LanguageCriterion")
        language.Language = "English"
        languages.LanguageCriterion.append([language])
        language_search_parameter.Languages = languages

        location_search_parameter = self._adinsight_service.factory.create("LocationSearchParameter")
        locations = self._adinsight_service.factory.create("ArrayOfLocationCriterion")
        location = self._adinsight_service.factory.create("LocationCriterion")
        location.LocationId = "190"  # United States
        locations.LocationCriterion.append([location])
        location_search_parameter.Locations = locations

        network_search_parameter = self._adinsight_service.factory.create("NetworkSearchParameter")
        network = self._adinsight_service.factory.create("NetworkCriterion")
        network.Network = "OwnedAndOperatedAndSyndicatedSearch"
        network_search_parameter.Network = network

        search_parameters.SearchParameter.append(
            [query_search_parameter, language_search_parameter, location_search_parameter, network_search_parameter]
        )

        ideas_attributes = self._adinsight_service.factory.create("ArrayOfKeywordIdeaAttribute")
        ideas_attributes.KeywordIdeaAttribute.append(["Keyword", "MonthlySearchCounts"])

        return search_parameters, ideas_attributes
