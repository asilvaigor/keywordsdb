"use server";

import { createHash } from "node:crypto";
import { FieldValue } from "@google-cloud/firestore";
import type { SortingState } from "@tanstack/react-table";
import firestore from "@/lib/db/firestore";
import { decreaseFreeCredits, getUserData } from "@/lib/db/users";
import type {
  CacheMiss,
  Keyword,
  KeywordFilters,
  KeywordsStreamResponse,
  Progress,
} from "@/lib/types";
import {
  getKeywordsCountClickhouse,
  getKeywordsCountSample,
} from "./keywords-count";
import { generatePresignedUrls } from "./keywords-download";
import {
  getKeywordsStreamClickhouse,
  getKeywordsStreamSample,
} from "./keywords-stream";

interface KeywordsCached {
  results: Keyword[];
  expires_at: Date;
}

interface KeywordCountsCached {
  count: number;
  expires_at: Date;
}

export async function* getKeywordsStream(
  filters: KeywordFilters,
  sorting: SortingState,
  columns: string[],
  page = 1,
  pageSize = 100,
  isSample: boolean = false,
): AsyncGenerator<KeywordsStreamResponse, void, unknown> {
  const userData = await getUserData();
  const isMaxPlan = userData?.subscriptionType === "max";
  if (
    !isSample &&
    (!userData ||
      (!userData.subscriptionActive && userData.freeCredits <= 0) ||
      (!isMaxPlan && columns.includes("volume_bing")) || // only max plan users can access Bing data
      (!isMaxPlan && filters.volume_bing != null) || // only max plan users can access Bing data
      (!isMaxPlan && sorting.some((s) => s.id === "volume_bing"))) // only max plan users can access Bing data
  ) {
    throw new Error("Unauthorized");
  }

  console.log(
    `[${userData?.email ?? "unknown"}] Starting getKeywordsStream with filters: ${JSON.stringify(filters)}, sorting: ${JSON.stringify(sorting)}, columns: ${columns.join(",")}, page: ${page}, pageSize: ${pageSize}, isSample: ${isSample}`,
  );

  const cacheKey = `keywords${isSample ? "-sample" : ""}-${JSON.stringify(filters)}-${JSON.stringify(sorting)}-${columns.join(",")}-${page}-${pageSize}`;
  const hash = createHash("sha256").update(cacheKey, "utf8").digest("hex");
  const docRef = firestore.collection("keywords-cache").doc(hash);
  const doc = (await docRef.get()).data() as KeywordsCached | undefined;

  if (doc) {
    console.log(
      `[${userData?.email ?? "unknown"}] Returning keywords from firestore cache`,
    );
    yield doc.results;
    return;
  }

  let allResults: Keyword[] = [];
  if (isSample) {
    console.log(
      `[${userData?.email ?? "unknown"}] Streaming keywords from sample`,
    );
    allResults = await getKeywordsStreamSample({
      filters,
      sorting,
      columns,
      page,
      pageSize,
    });
    yield allResults;
  } else {
    console.log(
      `[${userData?.email ?? "unknown"}] Streaming keywords from clickhouse`,
    );

    if (userData) {
      // always true
      decreaseFreeCredits(userData);
    }

    const cacheMiss: CacheMiss = { isCacheMiss: true };
    yield cacheMiss;

    for await (const chunk of getKeywordsStreamClickhouse({
      filters,
      sorting,
      columns,
      page,
      pageSize,
    })) {
      if ("isProgress" in chunk) {
        yield chunk as Progress;
      } else {
        const results = chunk as Keyword[];
        yield results;
        allResults.push(...results);
      }
    }
  }

  // Cache the results in Firestore asynchronously
  const cacheData: KeywordsCached = {
    results: allResults,
    expires_at: new Date(Date.now() + 24 * 3600 * 1000),
  };
  docRef.set(cacheData).catch(console.error);

  // Add keyword term to be ingested
  if (filters.keyword) {
    console.log(
      `[${userData?.email ?? "unknown"}] Adding keyword term to be ingested: ${filters.keyword}`,
    );
    firestore
      .collection("keywords-to-ingest")
      .doc("webapp")
      .set(
        { keywords: FieldValue.arrayUnion(filters.keyword) },
        { merge: true },
      )
      .catch(console.error);
  }

  console.log(
    `[${userData?.email ?? "unknown"}] Streaming query completed successfully`,
  );
}

export async function getKeywordsCount(
  filters: KeywordFilters,
  isSample: boolean = false,
): Promise<number> {
  const userData = await getUserData();
  const isMaxPlan = userData?.subscriptionType === "max";
  if (
    !isSample &&
    (!userData ||
      (!userData.subscriptionActive && userData.freeCredits <= 0) ||
      (!isMaxPlan && filters.volume_bing != null)) // only max plan users can access Bing data
  ) {
    throw new Error("Unauthorized");
  }

  const cacheKey = `keyword-counts${isSample ? "-sample" : ""}-${JSON.stringify(filters)}`;
  const hash = createHash("sha256").update(cacheKey, "utf8").digest("hex");
  const docRef = firestore.collection("keyword-counts-cache").doc(hash);
  const doc = (await docRef.get()).data() as KeywordCountsCached | undefined;
  if (doc) {
    console.log(
      `[${userData?.email ?? "unknown"}] Returning keyword count from firestore cache`,
    );
    return doc.count;
  }

  let count: number;
  if (isSample) {
    console.log(
      `[${userData?.email ?? "unknown"}] Getting keyword count from sample`,
    );
    count = await getKeywordsCountSample(filters);
  } else {
    console.log(
      `[${userData?.email ?? "unknown"}] Getting keyword count from clickhouse`,
    );
    count = await getKeywordsCountClickhouse(filters);
  }

  // Cache the result in Firestore asynchronously
  const cacheData: KeywordCountsCached = {
    count,
    expires_at: new Date(Date.now() + 24 * 3600 * 1000),
  };
  docRef.set(cacheData).catch(console.error);

  return count;
}

export async function getDownloadUrls({
  format,
  filters,
  sorting,
  isSample,
}: {
  format: "parquet" | "csv";
  filters: KeywordFilters;
  sorting: SortingState;
  isSample: boolean;
}) {
  const userData = await getUserData();
  const isMaxPlan = userData?.subscriptionType === "max";
  if (
    !isSample &&
    (!userData || !userData.subscriptionActive || !isMaxPlan) // only max plan users can download
  ) {
    throw new Error("Unauthorized");
  }
  const count = await getKeywordsCount(filters, isSample);
  const urls = await generatePresignedUrls({
    format,
    count,
    filters,
    sorting,
    isSample,
  });
  console.log(`[${userData?.email ?? "unknown"}] Returning download URLs`);
  return urls;
}
