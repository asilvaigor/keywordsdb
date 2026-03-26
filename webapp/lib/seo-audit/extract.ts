import type {
  ExtractedHeadings,
  ExtractedImage,
  ExtractedLinks,
  ExtractedMeta,
  ExtractedStructuredData,
  PageExtraction,
} from "@/lib/seo-audit/types";

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(html: string): string {
  return html
    .replace(
      /&(?:amp|lt|gt|quot|apos|nbsp|#39);/g,
      (match) => ENTITY_MAP[match] ?? match,
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

function extractVisibleText(html: string): string {
  let text = html;
  text = text.replace(
    /<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi,
    " ",
  );
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeEntities(text);
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function getAttr(tag: string, attr: string): string {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i");
  const match = tag.match(regex);
  return match ? decodeEntities(match[1].trim()) : "";
}

function getMetaContent(html: string, nameOrProp: string): string {
  // Match by name or property attribute
  const regex = new RegExp(
    `<meta\\s+[^>]*(?:name|property)\\s*=\\s*["']${nameOrProp}["'][^>]*>`,
    "i",
  );
  const match = html.match(regex);
  if (!match) return "";
  return getAttr(match[0], "content");
}

export function extractMeta(html: string): ExtractedMeta {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";

  // Description
  const description = getMetaContent(html, "description");

  // OG tags
  const ogTitle = getMetaContent(html, "og:title");
  const ogDescription = getMetaContent(html, "og:description");
  const ogImage = getMetaContent(html, "og:image");

  // Twitter card
  const twitterCard = getMetaContent(html, "twitter:card");

  // Canonical
  const canonicalMatch = html.match(
    /<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*>/i,
  );
  const canonical = canonicalMatch ? getAttr(canonicalMatch[0], "href") : "";

  // Viewport
  const viewport = getMetaContent(html, "viewport");

  // Language
  const langMatch = html.match(/<html[^>]*\slang\s*=\s*["']([^"']*)["']/i);
  const lang = langMatch ? langMatch[1].trim() : "";

  // Favicon
  const faviconRegex =
    /<link\s+[^>]*rel\s*=\s*["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/i;
  const favicon = faviconRegex.test(html);

  // Charset
  const charsetMeta = html.match(
    /<meta\s+[^>]*charset\s*=\s*["']?([^"'\s;>]+)/i,
  );
  const charsetHttp = html.match(
    /<meta\s+[^>]*content\s*=\s*["'][^"']*charset=([^"'\s;]+)/i,
  );
  const charset = (charsetMeta?.[1] ?? charsetHttp?.[1] ?? "").toUpperCase();

  // Doctype
  const doctype = /^<!DOCTYPE\s+html>/i.test(html.trimStart());

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    canonical,
    viewport,
    lang,
    favicon,
    charset,
    doctype,
  };
}

export function extractHeadings(html: string): ExtractedHeadings {
  const extract = (tag: string) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    const results: string[] = [];
    let match: RegExpExecArray | null = regex.exec(html);
    while (match !== null) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text) results.push(decodeEntities(text));
      match = regex.exec(html);
    }
    return results;
  };

  return { h1: extract("h1"), h2: extract("h2"), h3: extract("h3") };
}

export function extractImages(html: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const imgRegex = /<img\s[^>]*>/gi;
  let match: RegExpExecArray | null = imgRegex.exec(html);

  while (match !== null) {
    const tag = match[0];
    const src = getAttr(tag, "src");
    const alt = getAttr(tag, "alt");
    images.push({ src, alt, hasAlt: alt.length > 0 });
    match = imgRegex.exec(html);
  }

  return images;
}

export function extractLinks(html: string, baseUrl: string): ExtractedLinks {
  const internal: string[] = [];
  const external: string[] = [];
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]+)/gi;
  let match: RegExpExecArray | null;

  let parsedBase: URL;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    return { internal, external };
  }

  match = linkRegex.exec(html);
  while (match !== null) {
    try {
      const resolved = new URL(match[1], parsedBase);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
        match = linkRegex.exec(html);
        continue;
      }
      // Skip Cloudflare infrastructure paths
      if (resolved.pathname.startsWith("/cdn-cgi/")) {
        match = linkRegex.exec(html);
        continue;
      }
      if (resolved.hostname === parsedBase.hostname) {
        internal.push(resolved.href);
      } else {
        external.push(resolved.href);
      }
    } catch {
      // ignore
    }
    match = linkRegex.exec(html);
  }

  return { internal, external };
}

export function extractStructuredData(html: string): ExtractedStructuredData {
  const jsonLd =
    /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>/i.test(html);
  const microdata = /\bitemscope\b/i.test(html) && /\bitemtype\s*=/i.test(html);
  return { jsonLd, microdata };
}

export function calcTextToHtmlRatio(html: string, visibleText: string): number {
  if (html.length === 0) return 0;
  return (visibleText.length / html.length) * 100;
}

export function extractPage(html: string, pageUrl: string): PageExtraction {
  const meta = extractMeta(html);
  const headings = extractHeadings(html);
  const images = extractImages(html);
  const links = extractLinks(html, pageUrl);
  const structuredData = extractStructuredData(html);
  const visibleText = extractVisibleText(html);
  const wordCount = visibleText.split(/\s+/).filter((w) => w.length > 0).length;
  const textToHtmlRatio = calcTextToHtmlRatio(html, visibleText);

  return {
    meta,
    headings,
    images,
    links,
    structuredData,
    wordCount,
    textToHtmlRatio,
    visibleText,
  };
}
