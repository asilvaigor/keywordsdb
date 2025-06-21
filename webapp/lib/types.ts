export type Keyword = {
  keyword: string;
  avg_monthly_searches: number;
  competition_index: number;
  cpc_high: number;
  updated_at: string;
};

export type KeywordRow =
  | Keyword
  | {
      showSkeleton: boolean;
    };

export type KeywordFilters = {
  keyword?: string;
  avg_monthly_searches?: { min?: number; max?: number };
  competition_index?: { min?: number; max?: number };
  cpc_high?: { min?: number; max?: number };
};
