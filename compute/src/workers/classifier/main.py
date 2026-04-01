from src.services.bigquery import KeywordsTmpTable
from src.services.clickhouse import ClickhouseClient
from src.workers.classifier.classifier import Classifier
from src.workers.classifier.context import Context


def get_keywords_to_classify(client: ClickhouseClient) -> list[str]:
    query = "SELECT keyword FROM keywords WHERE intent = ''"
    df = client.execute_query(query)
    assert df is not None
    return sorted(df["keyword"].to_list())


if __name__ == "__main__":
    ctx = Context()

    keywords = get_keywords_to_classify(ctx.clickhouse_client)
    ctx.logger.info("Keywords to classify", count=len(keywords))

    classifier = Classifier(ctx.storage)
    ctx.logger.info("Loaded classifier")

    batch_size = 100_000
    n_batches = (len(keywords) + batch_size - 1) // batch_size
    for i in range(0, len(keywords), batch_size):
        batch = keywords[i : i + batch_size]
        batch_id = i // batch_size + 1
        ctx.logger.info(f"Processing batch {batch_id}/{n_batches}")

        df = classifier.classify(batch)
        ctx.bigquery_client.insert(KeywordsTmpTable, df)
        ctx.logger.info("Inserted batch", offset=i)

        ctx.logger.info(f"Batch {batch_id}/{n_batches} completed")
