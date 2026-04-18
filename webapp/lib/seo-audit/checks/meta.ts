import type {
  AuditCheck,
  AuditCheckPage,
  PageExtraction,
} from "@/lib/seo-audit/types";

const MAX_PAGES_PER_CHECK = 10;

export async function checkMeta(
  primaryPage: PageExtraction,
  primaryUrl: string,
  allPages: { url: string; extraction: PageExtraction }[],
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];

  // 1. Title present — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => !p.extraction.meta.title)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({ url: p.url, description: "Missing title tag" }));

    checks.push({
      id: "meta-title-present",
      category: "meta",
      title: "Title tag",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All ${allPages.length} page${allPages.length > 1 ? "s" : ""} have a title tag.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing a title tag. This is critical for SEO and click-through rates.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 2. Title length — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter(
        (p) =>
          p.extraction.meta.title &&
          (p.extraction.meta.title.length < 30 ||
            p.extraction.meta.title.length > 60),
      )
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: `"${p.extraction.meta.title}" (${p.extraction.meta.title.length} chars)`,
      }));

    checks.push({
      id: "meta-title-length",
      category: "meta",
      title: "Title length",
      status: failing.length === 0 ? "pass" : "warn",
      description:
        failing.length === 0
          ? `All page titles are within the ideal length (30–60 characters).`
          : `${failing.length} page${failing.length > 1 ? "s have" : " has"} a title outside the ideal 30–60 character range.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 3. Description present — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => !p.extraction.meta.description)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({ url: p.url, description: "Missing meta description" }));

    checks.push({
      id: "meta-desc-present",
      category: "meta",
      title: "Meta description",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All ${allPages.length} page${allPages.length > 1 ? "s" : ""} have a meta description.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing a meta description. Search engines may generate one automatically, which may not be ideal.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 4. Description length — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter(
        (p) =>
          p.extraction.meta.description &&
          (p.extraction.meta.description.length < 120 ||
            p.extraction.meta.description.length > 160),
      )
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: `${p.extraction.meta.description.length} chars — "${p.extraction.meta.description.slice(0, 80)}${p.extraction.meta.description.length > 80 ? "…" : ""}"`,
      }));

    checks.push({
      id: "meta-desc-length",
      category: "meta",
      title: "Description length",
      status: failing.length === 0 ? "pass" : "warn",
      description:
        failing.length === 0
          ? `All meta descriptions are within the ideal length (120–160 characters).`
          : `${failing.length} page${failing.length > 1 ? "s have" : " has"} a description outside the ideal 120–160 character range.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 5. Open Graph tags — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => {
        const { ogTitle, ogDescription, ogImage } = p.extraction.meta;
        return !ogTitle || !ogDescription || !ogImage;
      })
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => {
        const { ogTitle, ogDescription, ogImage } = p.extraction.meta;
        const missing = [
          !ogTitle && "og:title",
          !ogDescription && "og:description",
          !ogImage && "og:image",
        ].filter(Boolean);
        return { url: p.url, description: `Missing: ${missing.join(", ")}` };
      });

    checks.push({
      id: "meta-og-tags",
      category: "meta",
      title: "Open Graph tags",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages have the essential Open Graph tags (og:title, og:description, og:image).`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing Open Graph tags. These are important for social media sharing.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 6. Twitter Card — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => !p.extraction.meta.twitterCard)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: "Missing twitter:card meta tag",
      }));

    checks.push({
      id: "meta-twitter-card",
      category: "meta",
      title: "Twitter Card",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages have a Twitter Card meta tag.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing twitter:card meta tag. Add it for better Twitter/X sharing previews.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 7. Canonical URL — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => {
        const canonical = p.extraction.meta.canonical;
        if (!canonical) return true;
        const canonicalNorm = canonical.replace(/\/+$/, "");
        const pageNorm = p.url.replace(/\/+$/, "");
        return canonicalNorm !== pageNorm && canonical !== p.url;
      })
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => {
        const canonical = p.extraction.meta.canonical;
        return {
          url: p.url,
          description: canonical
            ? `Canonical "${canonical}" differs from page URL`
            : "No canonical URL specified",
        };
      });

    checks.push({
      id: "meta-canonical",
      category: "meta",
      title: "Canonical URL",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages have a correct canonical URL.`
          : `${failing.length} page${failing.length > 1 ? "s have" : " has"} a missing or mismatched canonical URL. This can cause duplicate content issues.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 8. Viewport meta — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => !p.extraction.meta.viewport)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({ url: p.url, description: "Missing viewport meta tag" }));

    checks.push({
      id: "meta-viewport",
      category: "meta",
      title: "Viewport meta tag",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages have a viewport meta tag configured for responsive design.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing viewport meta tag. This is essential for mobile-friendly pages.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 9. Language attribute — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => !p.extraction.meta.lang)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: "Missing lang attribute on <html> tag",
      }));

    checks.push({
      id: "meta-lang",
      category: "meta",
      title: "Language attribute",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages have the HTML lang attribute set.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing lang attribute on <html> tag. This helps search engines understand the page language.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 10. Favicon — site-level check (no per-page)
  {
    let hasFavicon = primaryPage.meta.favicon;
    if (!hasFavicon) {
      try {
        const faviconUrl = new URL("/favicon.ico", primaryUrl).href;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5_000);
        const res = await fetch(faviconUrl, {
          method: "HEAD",
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);
        hasFavicon =
          res.ok &&
          (res.headers.get("content-type")?.includes("image") ?? false);
      } catch {
        // ignore
      }
    }
    checks.push({
      id: "meta-favicon",
      category: "meta",
      title: "Favicon",
      status: hasFavicon ? "pass" : "fail",
      description: hasFavicon
        ? "Favicon is present."
        : "No favicon found. Add a favicon for better brand recognition in browser tabs and bookmarks.",
    });
  }

  // 11. Duplicate titles across crawled pages
  if (allPages.length > 1) {
    const titles = allPages
      .map((p) => ({ url: p.url, title: p.extraction.meta.title }))
      .filter((p) => p.title);
    const titleCounts = new Map<string, string[]>();
    for (const p of titles) {
      const existing = titleCounts.get(p.title) ?? [];
      existing.push(p.url);
      titleCounts.set(p.title, existing);
    }
    const duplicates = [...titleCounts.entries()].filter(
      ([, urls]) => urls.length > 1,
    );

    const pages: AuditCheckPage[] = duplicates
      .flatMap(([title, urls]) =>
        urls.map((url) => ({
          url,
          description: `Title: "${title}"`,
        })),
      )
      .slice(0, MAX_PAGES_PER_CHECK);

    checks.push({
      id: "meta-duplicate-titles",
      category: "meta",
      title: "Duplicate page titles",
      status: duplicates.length === 0 ? "pass" : "fail",
      description:
        duplicates.length === 0
          ? `All ${titles.length} crawled pages have unique titles.`
          : `Found ${duplicates.length} duplicate title${duplicates.length > 1 ? "s" : ""} across crawled pages. Each page should have a unique title.`,
      pages: pages.length > 0 ? pages : undefined,
    });
  }

  return checks;
}
