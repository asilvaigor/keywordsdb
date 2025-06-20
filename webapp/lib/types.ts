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
