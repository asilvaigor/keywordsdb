import polars as pl

from worker.services.bigquery import BigQueryClient


class KeywordsToIngest:
    tablename = "keywords_to_ingest"

    @staticmethod
    def pop(client: BigQueryClient, n: int) -> list[str]:
        """
        Query the keywords_to_ingest table to get N records.

        Args:
            n: Number of records to retrieve

        Returns:
            list of keywords
        """
        query = f"""
            SELECT keyword
            FROM `{client.get_full_name(KeywordsToIngest.tablename)}`
            LIMIT {n}
        """

        rows = client.client.query(query).result()
        return [dict(row.items())["keyword"] for row in rows]

    @staticmethod
    def delete(client: BigQueryClient, keywords: list[str]) -> None:
        """
        Delete records from the keywords_to_ingest table.

        Args:
            keywords: List of keywords to delete
        """
        query = f"""
            DELETE FROM `{client.get_full_name(KeywordsToIngest.tablename)}`
            WHERE keyword IN ({", ".join([f'"{keyword}"' for keyword in keywords])})
        """

        client.client.query(query).result()

    @staticmethod
    def insert(client: BigQueryClient, keywords: list[str]) -> None:
        """
        Insert records into the keywords_to_ingest table.

        Args:
            keywords: List of keywords to insert
        """
        df = pl.DataFrame({"keyword": keywords})
        client.insert(KeywordsToIngest.tablename, df)
