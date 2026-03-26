import type { BlogPost } from "@/lib/blog/posts";

const BASE_URL = "https://keywordsdb.com";

const organization = {
  "@type": "Organization",
  name: "KeywordsDB",
  url: BASE_URL,
  logo: `${BASE_URL}/og-image.png`,
};

export function websiteJsonLd(options?: {
  name?: string;
  url?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: options?.name ?? "KeywordsDB",
    url: options?.url ?? BASE_URL,
    description:
      options?.description ??
      "Get full access to 290M+ keywords for data-driven research. Search, filter and sort them by volume, CPC, and competition.",
    publisher: organization,
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function articleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: `${BASE_URL}${post.ogImage}`,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: "Igor Silva",
    },
    publisher: organization,
    url: `${BASE_URL}/blog/${post.slug}`,
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
