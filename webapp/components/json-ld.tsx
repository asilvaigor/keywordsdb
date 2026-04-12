import type { BlogPost } from "@/lib/blog/posts";

const BASE_URL = "https://keywordsdb.com";

const organization = {
  "@type": "Organization",
  name: "KeywordsDB",
  url: BASE_URL,
  logo: `${BASE_URL}/og-image.png`,
};

export function FAQJsonLD({
  items,
}: {
  items: { question: string; answer: React.ReactNode; textAnswer?: string }[];
}) {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.textAnswer || faq.answer,
          },
        })),
      })}
    </script>
  );
}

export function ArticleJsonLD({ post }: { post: BlogPost }) {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        image: `${BASE_URL}/blog/${post.slug}/og-image.png`,
        datePublished: post.date,
        author: {
          "@type": "Person",
          name: "Igor Silva",
        },
        publisher: organization,
        url: `${BASE_URL}/blog/${post.slug}`,
        mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
      })}
    </script>
  );
}

export function BreadcrumbJsonLD({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      })}
    </script>
  );
}
