import type {
  AuditCheck,
  AuditCheckPage,
  PageExtraction,
} from "@/lib/seo-audit/types";

const MAX_PAGES_PER_CHECK = 10;

export function checkContent(
  allPages: { url: string; extraction: PageExtraction }[],
): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // 1. Word count — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => p.extraction.wordCount < 300)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: `${p.extraction.wordCount.toLocaleString()} words`,
      }));

    checks.push({
      id: "content-word-count",
      category: "content",
      title: "Word count",
      status: failing.length === 0 ? "pass" : "warn",
      description:
        failing.length === 0
          ? `All ${allPages.length} page${allPages.length > 1 ? "s" : ""} have at least 300 words.`
          : `${failing.length} page${failing.length > 1 ? "s have" : " has"} fewer than 300 words. Aim for at least 300 words for better search visibility.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 2. Heading structure — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => {
        const { h1, h2 } = p.extraction.headings;
        return h1.length !== 1 || h2.length < 1;
      })
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => {
        const { h1, h2, h3 } = p.extraction.headings;
        let issue: string;
        if (h1.length === 0) issue = "Missing H1 tag";
        else if (h1.length > 1) issue = `${h1.length} H1 tags (should be 1)`;
        else issue = "No H2 tags to structure content";
        return {
          url: p.url,
          description: `${issue} — H1: ${h1.length}, H2: ${h2.length}, H3: ${h3.length}`,
        };
      });

    checks.push({
      id: "content-headings",
      category: "content",
      title: "Heading structure",
      status: failing.length === 0 ? "pass" : "warn",
      description:
        failing.length === 0
          ? `All pages have good heading structure (1 H1 + at least 1 H2).`
          : `${failing.length} page${failing.length > 1 ? "s have" : " has"} heading structure issues. Use exactly one H1 and at least one H2 per page.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 3. Image alt text — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => {
        const images = p.extraction.images;
        if (images.length === 0) return false;
        return images.some((img) => !img.hasAlt);
      })
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => {
        const total = p.extraction.images.length;
        const missing = p.extraction.images.filter((img) => !img.hasAlt).length;
        return {
          url: p.url,
          description: `${missing} of ${total} image${total > 1 ? "s" : ""} missing alt text`,
        };
      });

    checks.push({
      id: "content-image-alt",
      category: "content",
      title: "Image alt text",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All images across ${allPages.length} page${allPages.length > 1 ? "s" : ""} have alt text.`
          : `${failing.length} page${failing.length > 1 ? "s have" : " has"} images missing alt text. Add descriptive alt text for accessibility and SEO.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  return checks;
}
