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

export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() : "";
}

export function extractVisibleText(html: string): string {
  let text = html;

  // Remove script, style, noscript, svg, and template blocks
  text = text.replace(
    /<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi,
    " ",
  );

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = decodeEntities(text);

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}
