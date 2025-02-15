import asyncio
import os

from dotenv import load_dotenv

from worker.context import Context


def get_keywords_from_wordnet(wordtype: str) -> list[str]:
    with open(f"{os.path.dirname(__file__)}/../../data/dict/index.{wordtype}") as f:
        lines = f.readlines()
    return sorted(set([line.split()[0].replace("_", " ").lower() for line in lines if not line.startswith(" ")]))


async def main() -> None:
    ctx = Context()

    ctx.logger.info("Getting keywords list")
    keywords = get_keywords_from_wordnet("noun")

    ctx.logger.info(f"Got {len(keywords)} keywords, writing in bigquery")
    ctx.bigquery_client.insert_keywords_to_ingest(keywords)
    ctx.logger.info("Success")


if __name__ == "__main__":
    load_dotenv()
    asyncio.run(main())
