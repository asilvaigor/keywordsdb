import type { AuditCheck, PageExtraction } from "@/lib/seo-audit/types";

export function checkContent(primaryPage: PageExtraction): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // 1. Word count
  const wc = primaryPage.wordCount;
  const wcStatus = wc >= 300 ? "pass" : "fail";
  checks.push({
    id: "content-word-count",
    category: "content",
    title: "Word count",
    status: wcStatus,
    description:
      wcStatus === "pass"
        ? `Page has ${wc.toLocaleString()} words — good content length.`
        : `Page has only ${wc.toLocaleString()} words. Aim for at least 300 words for better search visibility.`,
  });

  // 2. Heading structure
  const { h1, h2 } = primaryPage.headings;
  const h1Count = h1.length;
  const h2Count = h2.length;

  let headingStatus: "pass" | "fail";
  let headingDesc: string;

  if (h1Count === 1 && h2Count >= 1) {
    headingStatus = "pass";
    headingDesc = `Good heading structure: 1 H1 and ${h2Count} H2 tag${h2Count > 1 ? "s" : ""}.`;
  } else if (h1Count === 1 && h2Count === 0) {
    headingStatus = "fail";
    headingDesc =
      "Page has 1 H1 but no H2 tags. Use H2 headings to structure your content.";
  } else if (h1Count > 1) {
    headingStatus = "fail";
    headingDesc = `Page has ${h1Count} H1 tags — use exactly one H1 per page for clear topic hierarchy.`;
  } else {
    headingStatus = "fail";
    headingDesc =
      "Page is missing an H1 tag. Every page should have exactly one H1 heading.";
  }

  checks.push({
    id: "content-headings",
    category: "content",
    title: "Heading structure",
    status: headingStatus,
    description: headingDesc,
    details: `H1: ${h1Count}, H2: ${h2Count}, H3: ${primaryPage.headings.h3.length}`,
  });

  // 3. Image alt text
  const images = primaryPage.images;
  if (images.length > 0) {
    const withAlt = images.filter((img) => img.hasAlt).length;
    const pct = (withAlt / images.length) * 100;
    const status = pct === 100 ? "pass" : "fail";
    checks.push({
      id: "content-image-alt",
      category: "content",
      title: "Image alt text",
      status,
      description:
        status === "pass"
          ? `All ${images.length} image${images.length > 1 ? "s" : ""} have alt text.`
          : `${withAlt} of ${images.length} images (${Math.round(pct)}%) have alt text. Add descriptive alt text to all images for accessibility and SEO.`,
    });
  } else {
    checks.push({
      id: "content-image-alt",
      category: "content",
      title: "Image alt text",
      status: "pass",
      description: "No images found on the page (nothing to check).",
    });
  }

  return checks;
}
