export type AuditStatus = "pass" | "fail";

export type AuditCategory =
  | "meta"
  | "content"
  | "technical"
  | "links"
  | "performance";

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
