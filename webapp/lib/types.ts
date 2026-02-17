export type Keyword = {
  keyword: string;
  avg_monthly_searches: number;
  competition_index: number;
  cpc_high: number;
  volume_history: string;
  updated_at: string;
};

export type CacheMiss = {
  isCacheMiss: boolean;
};

export type ClickhouseProgress = {
  read_rows: number;
  total_rows_to_read: number;
};

export type Progress = {
  isProgress: boolean;
  percent: number;
};

export type KeywordsStreamResponse = Keyword[] | CacheMiss | Progress;

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

export type UserData = {
  email: string;
  freeCredits: number;
  lastFreeCreditUsedAt: Date | null;
  subscriptionActive: boolean;
  subscriptionType: "pro" | "max" | null;
};
