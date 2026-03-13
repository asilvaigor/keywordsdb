import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAllPosts, getPost } from "@/lib/blog/posts";

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      url: `/blog/${slug}`,
      locale: "en_US",
      siteName: "keywordsdb",
      images: {
        url: post.ogImage,
        width: post.ogImageWidth,
        height: post.ogImageHeight,
        alt: post.ogImageAlt,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { default: PostContent } = await import(`@/content/blog/${slug}.mdx`);
  const featuredSnippetJsonLd = (() => {
    if (post.featuredSnippetItems && post.featuredSnippetItems.length > 0) {
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: post.title,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: post.featuredSnippetItems.length,
        itemListElement: post.featuredSnippetItems.map((item) => ({
          "@type": "ListItem",
          position: item.position,
          name: item.name,
          description: item.value,
        })),
      });
    }
    if (post.featuredSnippetDescription) {
      return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: post.title,
        description: post.featuredSnippetDescription,
        url: `/blog/${slug}`,
      });
    }
    return null;
  })();
  return (
    <div className="flex flex-col">
      {featuredSnippetJsonLd && (
        <Script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled server-side data
          dangerouslySetInnerHTML={{ __html: featuredSnippetJsonLd }}
        />
      )}
      <Header />
      <main className="flex-1">
        <article className="container mx-auto max-w-3xl px-4 py-12">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <header className="mb-10">
            <h1 className="mb-6 text-3xl md:text-4xl font-bold tracking-tight">
              {post.title}
            </h1>
            <div className="flex flex-col sm:flex-row gap-5 items-start justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="/blog/igor.webp" />
                  <AvatarFallback>IS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Igor Silva
                  </p>
                  <p className="text-xs">Founder of KeywordsDB</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </header>

          <div className="mb-10">
            <Image
              src={post.coverImage ? post.coverImage : post.ogImage}
              alt={post.coverImageAlt ? post.coverImageAlt : post.ogImageAlt}
              className="w-full rounded-lg object-cover"
              width={
                post.coverImageWidth ? post.coverImageWidth : post.ogImageWidth
              }
              height={
                post.coverImageHeight
                  ? post.coverImageHeight
                  : post.ogImageHeight
              }
              preload
            />
            {post.coverImageCitation && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                {post.coverImageCitation}
              </p>
            )}
          </div>

          <div className="prose prose-invert prose-yellow max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline prose-a:hover:underline prose-strong:text-foreground prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none">
            <PostContent />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
