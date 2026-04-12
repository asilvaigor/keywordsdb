import type { Metadata } from "next";

export function getMetadata({
  title,
  description,
  canonicalUrl,
}: {
  title: string;
  description: string;
  canonicalUrl: string;
}): Metadata {
  return {
    title,
    description,
    metadataBase: "https://keywordsdb.com",
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      locale: "en_US",
      siteName: "KeywordsDB",
      images: {
        url: "/og-image.png",
        width: 2291,
        height: 1287,
        alt: title,
      },
    },
  };
}
