# /// script  # noqa: N999
# requires-python = ">=3.11"
# dependencies = [
#   "polars",
#   "pyarrow",
#   "ollama",
#   "tqdm",
# ]
# ///

"""
Labeling script that uses a local Ollama model to classify keywords into structured categories.
To be executed locally in a Macbook Pro, it took about 24h for 100k keywords.
"""

import asyncio
import csv
import io
import sys

import ollama  # ty:ignore[unresolved-import]
import polars as pl
from tqdm.asyncio import tqdm

PROMPT = """You are an expert in SEO, search intent classification, and SaaS opportunity analysis.

Your task is to classify keywords into structured categories.

You must follow the definitions EXACTLY and be consistent.

## DEFINITIONS

- Intent (choose ONE of four): informational, commercial, transactional, navigational
- Entity Type (choose ONE): person, event, location, company, product, other
- NSFW Score (0 to 1): how likely this keyword is NSFW or adult content
- SaaS Potential (0 to 1): how likely this keyword could be monetized by a SaaS product
- Is Question: 1 if the keyword is a question, 0 otherwise
- Is Comparison: 1 if the keyword compares options (e.g. "vs", "versus", "alternative to", "better than"), 0 otherwise
- Is Branded: 1 if the keyword contains a brand, company, or product name, 0 otherwise

## OUTPUT FORMAT

Return one CSV line per keyword, in the same order, with exactly these 8 fields:
keyword,intent,entity,nsfw,saas_potential,is_question,is_comparison,is_branded

Do not output anything else — no header, no explanation, no markdown.

Example output for 2 keywords:
best project management software,commercial,product,0.1,0.9,0,1,0
chaturbate,navigational,product,1.0,0.2,0,0,1

Now classify the following keywords:
"""  # noqa: E501

SCHEMA = {
    "keyword": pl.String,
    "intent": pl.String,
    "entity": pl.String,
    "nsfw": pl.Float32,
    "saas_potential": pl.Float32,
    "is_question": pl.Boolean,
    "is_comparison": pl.Boolean,
    "is_branded": pl.Boolean,
}


def _parse_csv_response(text: str, keywords: list[str]) -> list[dict]:
    rows = list(csv.reader(io.StringIO(text.strip())))
    result = []
    for i, kw in enumerate(keywords):
        row = rows[i] if i < len(rows) else []
        assert len(row) == len(SCHEMA), (
            f"Row length mismatch for keyword '{kw}': expected {len(SCHEMA)}, got {len(row)}"
        )
        assert row[0] == kw, f"Keyword mismatch: expected '{kw}', got '{row[0] if row else ''}'"
        result.append(
            {
                "keyword": kw,
                "intent": row[1],
                "entity": row[2],
                "nsfw": float(row[3]),
                "saas_potential": float(row[4]),
                "is_question": row[5] == "1",
                "is_comparison": row[6] == "1",
                "is_branded": row[7] == "1",
            }
        )
    return result


async def _classify_batch_async(client: ollama.AsyncClient, keywords: list[str]) -> list[dict] | None:
    keyword_text = "\n".join(f'{i + 1}. "{kw}"' for i, kw in enumerate(keywords))
    response = await client.chat(
        model="gemma4:26b",
        messages=[{"role": "user", "content": PROMPT + keyword_text}],
        options={"temperature": 0},
        think=False,
    )
    text = response["message"]["content"].strip()
    try:
        return _parse_csv_response(text, keywords)
    except Exception:
        return None


async def _process_batch(
    i: int,
    batch: list[str],
    client: ollama.AsyncClient,
    semaphore: asyncio.Semaphore,
    results: list[list[dict] | None],
    max_retries: int = 3,
) -> None:
    async with semaphore:
        for _ in range(max_retries):
            r = await _classify_batch_async(client, batch)
            if r is not None:
                results[i] = r
                return
        print(f"Batch {i} failed after {max_retries} attempts", file=sys.stderr)
        results[i] = [{}] * len(batch)


def _flush_checkpoint(results: list[list[dict] | None]) -> None:
    all_so_far = [label for batch_result in results if batch_result for label in batch_result]
    pl.DataFrame(all_so_far, schema=SCHEMA).write_parquet("labels.parquet")
    print(f"  Checkpoint: saved {len(all_so_far):,} labels to labels.parquet")


async def main_async() -> None:
    sample = pl.read_parquet("sample.parquet")
    keyword_list = sample["keyword"].to_list()
    batches = [keyword_list[i : i + 10] for i in range(0, len(keyword_list), 10)]
    print(f"Loaded {len(keyword_list):,} keywords, {len(batches)} batches (size=10, concurrency=2)")

    client = ollama.AsyncClient()
    semaphore = asyncio.Semaphore(2)
    results: list[list[dict] | None] = [None] * len(batches)
    completed = 0
    checkpoint_every = 100

    async def _process_and_checkpoint(i: int, batch: list[str]) -> None:
        nonlocal completed
        await _process_batch(i, batch, client, semaphore, results)
        completed += 1
        if completed % checkpoint_every == 0:
            _flush_checkpoint(results)

    tasks = [_process_and_checkpoint(i, batch) for i, batch in enumerate(batches)]
    await tqdm.gather(*tasks, desc="Classifying")

    all_labels = [label for batch_result in results if batch_result for label in batch_result]
    failed_batches = sum(1 for r in results if r and all(not row for row in r))
    print(f"Total labels: {len(all_labels):,}, failed batches: {failed_batches}")

    pl.DataFrame(all_labels, schema=SCHEMA).write_parquet("labels.parquet")
    print("Saved to labels.parquet")


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
