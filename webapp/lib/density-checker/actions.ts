"use server";

import { analyzeText } from "@/lib/density-checker/count-words";
import {
  extractTitle,
  extractVisibleText,
} from "@/lib/density-checker/extract-text";
import type { DensityResponse } from "@/lib/density-checker/types";

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "metadata.google.internal",
]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB

export async function analyzePage(
  url: string,
): Promise<{ data?: DensityResponse; error?: string }> {
  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "Please enter a valid URL (e.g. https://example.com)" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "URL must start with http:// or https://" };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { error: "Cannot analyze internal or private URLs" };
  }

  // Fetch the page
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KeywordsDB/1.0; +https://keywordsdb.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        error: `Failed to fetch page: ${response.status} ${response.statusText}`,
      };
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_SIZE) {
      return { error: "Page is too large to analyze (max 5MB)" };
    }

    html = await response.text();
    if (html.length > MAX_RESPONSE_SIZE) {
      return { error: "Page is too large to analyze (max 5MB)" };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { error: "Request timed out — the page took too long to respond" };
    }
    return {
      error: "Could not fetch the page. Please check the URL and try again.",
    };
  }

  const title = extractTitle(html);
  const text = extractVisibleText(html);

  if (text.length < 10) {
    return {
      error: "Could not extract enough text from this page to analyze",
    };
  }

  const { totalWords, results } = analyzeText(text);

  return {
    data: { url, title, totalWords, results },
  };
}
