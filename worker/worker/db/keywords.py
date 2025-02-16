from worker.db.keywords_tmp import KeywordsTmp
from worker.services.bigquery import BigQueryClient


class Keywords:
    tablename = "keywords"

    @staticmethod
    def get_oldest(client: BigQueryClient, n: int) -> list[str]:
        """
        Query the keywords table to get the N oldest records based on ingested_at.

        Args:
            n: Number of records to retrieve

        Returns:
            list of keywords
        """
        query = f"""
            SELECT keyword
            FROM `{client.get_full_name(Keywords.tablename)}`
            WHERE avg_monthly_searches > 0
            ORDER BY ingested_at ASC, avg_monthly_searches DESC
            LIMIT {n}
        """

        rows = client.client.query(query).result()
        return [dict(row.items())["keyword"] for row in rows]

    @staticmethod
    def update_from_tmp(client: BigQueryClient) -> None:
        """
        Copies data from keywords_tmp into the keywords table and cleans the keywords_tmp table.
        """
        merge_query = f"""
            MERGE `{client.get_full_name(Keywords.tablename)}` keywords
            USING (
                SELECT
                    keyword,
                    avg_monthly_searches,
                    competition_index,
                    cpc_high,
                    updated_at,
                    ingested_at
                FROM `{client.get_full_name(KeywordsTmp.tablename)}`
                QUALIFY ROW_NUMBER() OVER (PARTITION BY keyword ORDER BY updated_at DESC) = 1
            ) tmp
            ON keywords.keyword = tmp.keyword
            WHEN MATCHED THEN
                UPDATE SET
                    avg_monthly_searches = tmp.avg_monthly_searches,
                    competition_index = tmp.competition_index,
                    cpc_high = tmp.cpc_high,
                    updated_at = tmp.updated_at,
                    ingested_at = CASE
                        WHEN tmp.ingested_at IS NULL THEN keywords.ingested_at
                        ELSE tmp.ingested_at
                    END
            WHEN NOT MATCHED THEN
                INSERT (keyword, avg_monthly_searches, competition_index, cpc_high, updated_at, ingested_at)
                VALUES (keyword, avg_monthly_searches, competition_index, cpc_high, updated_at, ingested_at)
        """

        merge_job = client.client.query(merge_query)
        merge_job.result()
        client.client.delete_table(client.get_full_name(KeywordsTmp.tablename))
