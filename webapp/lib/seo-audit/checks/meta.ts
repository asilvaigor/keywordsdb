import type { AuditCheck, PageExtraction } from "@/lib/seo-audit/types";

export async function checkMeta(
  primaryPage: PageExtraction,
  primaryUrl: string,
  allPages: { url: string; extraction: PageExtraction }[],
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const { meta } = primaryPage;

  // 1. Title present
  checks.push(
    meta.title
      ? {
          id: "meta-title-present",
          category: "meta",
          title: "Title tag",
          status: "pass",
          description: "Page has a title tag.",
          details: `"${meta.title}"`,
        }
      : {
          id: "meta-title-present",
          category: "meta",
          title: "Title tag",
          status: "fail",
          description:
            "Page is missing a title tag. This is critical for SEO and click-through rates.",
        },
  );

  // 2. Title length
  if (meta.title) {
    const len = meta.title.length;
    const status = len >= 30 && len <= 60 ? "pass" : "fail";
    checks.push({
      id: "meta-title-length",
      category: "meta",
      title: "Title length",
      status,
      description:
        status === "pass"
          ? `Title is ${len} characters — ideal length (30-60).`
          : `Title is ${len} characters — should be between 30-60 characters to avoid truncation in search results.`,
      details: `"${meta.title}" (${len} chars)`,
    });
  }

  // 3. Description present
  checks.push(
    meta.description
      ? {
          id: "meta-desc-present",
          category: "meta",
          title: "Meta description",
          status: "pass",
          description: "Page has a meta description.",
          details: `"${meta.description.slice(0, 160)}${meta.description.length > 160 ? "…" : ""}"`,
        }
      : {
          id: "meta-desc-present",
          category: "meta",
          title: "Meta description",
          status: "fail",
          description:
            "Page is missing a meta description. Search engines may generate one automatically, which may not be ideal.",
        },
  );

  // 4. Description length
  if (meta.description) {
    const len = meta.description.length;
    const status = len >= 120 && len <= 160 ? "pass" : "fail";
    checks.push({
      id: "meta-desc-length",
      category: "meta",
      title: "Description length",
      status,
      description:
        status === "pass"
          ? `Description is ${len} characters — ideal length (120-160).`
          : `Description is ${len} characters — should be between 120-160 characters for optimal display in search results.`,
    });
  }

  // 5. Open Graph tags
  const ogPresent = [meta.ogTitle, meta.ogDescription, meta.ogImage].filter(
    Boolean,
  ).length;
  checks.push({
    id: "meta-og-tags",
    category: "meta",
    title: "Open Graph tags",
    status: ogPresent === 3 ? "pass" : "fail",
    description:
      ogPresent === 3
        ? "All essential Open Graph tags are present (og:title, og:description, og:image)."
        : ogPresent > 0
          ? `Only ${ogPresent}/3 Open Graph tags found. Missing: ${[
              !meta.ogTitle && "og:title",
              !meta.ogDescription && "og:description",
              !meta.ogImage && "og:image",
            ]
              .filter(Boolean)
              .join(", ")}.`
          : "No Open Graph tags found. These are important for social media sharing.",
  });

  // 6. Twitter Card
  checks.push({
    id: "meta-twitter-card",
    category: "meta",
    title: "Twitter Card",
    status: meta.twitterCard ? "pass" : "fail",
    description: meta.twitterCard
      ? `Twitter Card meta tag is present (${meta.twitterCard}).`
      : "Missing twitter:card meta tag. Add it for better Twitter/X sharing previews.",
  });

  // 7. Canonical URL
  if (meta.canonical) {
    // Check if canonical matches the page URL
    const canonicalNorm = meta.canonical.replace(/\/+$/, "");
    const pageNorm = primaryUrl.replace(/\/+$/, "");
    const matches = canonicalNorm === pageNorm || meta.canonical === primaryUrl;
    checks.push({
      id: "meta-canonical",
      category: "meta",
      title: "Canonical URL",
      status: matches ? "pass" : "fail",
      description: matches
        ? "Canonical URL is set and matches the page URL."
        : `Canonical URL (${meta.canonical}) differs from the page URL. This may be intentional, but verify it's correct.`,
    });
  } else {
    checks.push({
      id: "meta-canonical",
      category: "meta",
      title: "Canonical URL",
      status: "fail",
      description:
        "No canonical URL specified. Add one to prevent duplicate content issues.",
    });
  }

  // 8. Viewport meta
  checks.push({
    id: "meta-viewport",
    category: "meta",
    title: "Viewport meta tag",
    status: meta.viewport ? "pass" : "fail",
    description: meta.viewport
      ? "Viewport meta tag is configured for responsive design."
      : "Missing viewport meta tag. This is essential for mobile-friendly pages.",
  });

  // 9. Language attribute
  checks.push({
    id: "meta-lang",
    category: "meta",
    title: "Language attribute",
    status: meta.lang ? "pass" : "fail",
    description: meta.lang
      ? `HTML lang attribute is set to "${meta.lang}".`
      : "Missing lang attribute on <html> tag. This helps search engines understand the page language.",
  });

  // 10. Favicon — check link tag or try /favicon.ico
  let hasFavicon = meta.favicon;
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
        res.ok && (res.headers.get("content-type")?.includes("image") ?? false);
    } catch {
      // ignore — keep hasFavicon false
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

    checks.push({
      id: "meta-duplicate-titles",
      category: "meta",
      title: "Duplicate page titles",
      status: duplicates.length === 0 ? "pass" : "fail",
      description:
        duplicates.length === 0
          ? `All ${titles.length} crawled pages have unique titles.`
          : `Found ${duplicates.length} duplicate title(s) across crawled pages. Each page should have a unique title.`,
      details:
        duplicates.length > 0
          ? duplicates
              .slice(0, 3)
              .map(([title, urls]) => `"${title}" (${urls.length} pages)`)
              .join("; ")
          : undefined,
    });
  }

  return checks;
}
