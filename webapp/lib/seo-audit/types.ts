export type AuditStatus = "pass" | "warn" | "fail";

export type AuditCategory = "meta" | "content" | "technical" | "links";

export type AuditCheckPage = {
  url: string;
  description: string;
};

export type AuditCheck = {
  id: string;
  category: AuditCategory;
  title: string;
  status: AuditStatus;
  description: string;
  details?: string | string[];
  pages?: AuditCheckPage[];
};

export type AuditCategoryResult = {
  category: AuditCategory;
  label: string;
  score: number; // 0-100
  checks: AuditCheck[];
};

export type AuditResult = {
  type: "result";
  url: string;
  score: number; // 0-100
  categories: AuditCategoryResult[];
  pagesCrawled: number;
  crawlTimeMs: number;
};

export type AuditProgress = {
  type: "progress";
  pagesScanned: number;
  totalPages: number;
  currentUrl: string;
};

export type AuditError = {
  type: "error";
  error: string;
};

/** PageSpeed Insights / Lighthouse result */
export type LighthouseCoreVital = {
  label: string;
  value: string;
  score: number; // 0-1
};

/** Pre-formatted table extracted from a Lighthouse audit's details object */
export type LighthouseAuditDetails = {
  headings: string[];
  rows: string[][];
} | null;

export type LighthouseAuditItem = {
  id: string;
  title: string;
  description: string;
  score: number | null; // null = informational
  displayValue?: string;
  details?: LighthouseAuditDetails;
};

export type LighthouseResult = {
  type: "lighthouse";
  performanceScore: number; // 0-100
  metrics: {
    fcp: LighthouseCoreVital;
    lcp: LighthouseCoreVital;
    tbt: LighthouseCoreVital;
    cls: LighthouseCoreVital;
    si: LighthouseCoreVital;
    tti: LighthouseCoreVital;
  };
  opportunities: LighthouseAuditItem[];
  diagnostics: LighthouseAuditItem[];
};

export type LighthouseError = {
  type: "lighthouse-error";
  error: string;
};

export type AuditStreamEvent = AuditProgress | AuditResult | AuditError;

/** Internal types used during crawling */

export type CrawledPage = {
  url: string;
  finalUrl: string;
  html: string;
  status: number;
  headers: Record<string, string>;
  responseTimeMs: number;
  byteSize: number;
};

export type CrawlData = {
  pages: CrawledPage[];
  robotsTxt: string | null;
  sitemapXml: string | null;
  startUrl: string;
  domain: string;
};

export type ExtractedMeta = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  canonical: string;
  viewport: string;
  lang: string;
  favicon: boolean;
  charset: string;
  doctype: boolean;
};

export type ExtractedHeadings = {
  h1: string[];
  h2: string[];
  h3: string[];
};

export type ExtractedImage = {
  src: string;
  alt: string;
  hasAlt: boolean;
};

export type ExtractedLinks = {
  internal: string[];
  external: string[];
};

export type ExtractedStructuredData = {
  jsonLd: boolean;
  microdata: boolean;
};

export type PageExtraction = {
  meta: ExtractedMeta;
  headings: ExtractedHeadings;
  images: ExtractedImage[];
  links: ExtractedLinks;
  structuredData: ExtractedStructuredData;
  wordCount: number;
  textToHtmlRatio: number;
  visibleText: string;
};
