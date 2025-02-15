"use server";

import type { Keyword } from "@/lib/types";
import { BigQuery } from "@google-cloud/bigquery";
import type { SortingState } from "@tanstack/react-table";

interface KeywordFilters {
  keyword?: string;
  minMonthlySearches?: number;
  maxMonthlySearches?: number;
  minCompetitionIndex?: number;
  maxCompetitionIndex?: number;
  minCpcHigh?: number;
  maxCpcHigh?: number;
}

interface PaginatedKeywords {
  keywords: Keyword[];
  totalRows: number;
  totalPages: number;
  currentPage: number;
}

const bigquery = new BigQuery();

export async function getKeywords(
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 10,
): Promise<PaginatedKeywords> {
  let query =
    "SELECT *, COUNT(*) OVER() as total_count FROM `keywordsdb-3.keywords.keywords` WHERE 1=1";
  const params = [];

  if (filters?.keyword) {
    query += " AND keyword LIKE LOWER(?)";
    params.push(`%${filters.keyword}%`);
  }
  if (filters?.minMonthlySearches !== undefined) {
    query += " AND avg_monthly_searches >= ?";
    params.push(filters.minMonthlySearches);
  }
  if (filters?.maxMonthlySearches !== undefined) {
    query += " AND avg_monthly_searches <= ?";
    params.push(filters.maxMonthlySearches);
  }
  if (filters?.minCompetitionIndex !== undefined) {
    query += " AND competition_index >= ?";
    params.push(filters.minCompetitionIndex);
  }
  if (filters?.maxCompetitionIndex !== undefined) {
    query += " AND competition_index <= ?";
    params.push(filters.maxCompetitionIndex);
  }
  if (filters?.minCpcHigh !== undefined) {
    query += " AND cpc_high >= ?";
    params.push(filters.minCpcHigh);
  }
  if (filters?.maxCpcHigh !== undefined) {
    query += " AND cpc_high <= ?";
    params.push(filters.maxCpcHigh);
  }

  if (sort) {
    for (const s of sort) {
      query += ` ORDER BY ${s.id} ${s.desc ? "DESC" : "ASC"}`;
    }
  }

  const offset = (page - 1) * pageSize;
  query += " LIMIT ? OFFSET ?";
  params.push(pageSize, offset);

  const [rows] = await bigquery.query({ query, params });
  const totalRows = rows[0]?.total_count || 0;
  const totalPages = Math.ceil(totalRows / pageSize);

  return {
    keywords: rows.map((row) => ({
      keyword: row.keyword,
      avg_monthly_searches: row.avg_monthly_searches,
      competition_index: row.competition_index,
      cpc_high: row.cpc_high.toFixed(2),
      updated_at: row.updated_at.value,
    })) as Keyword[],
    totalRows,
    totalPages,
    currentPage: page,
  };
}
