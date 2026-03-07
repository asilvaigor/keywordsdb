import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { type BlogPost, getAllPosts } from "@/lib/blog/posts";

const title = "Blog | KeywordsDB";
const description =
  "Keyword research tips, SEO strategies, and product updates from the KeywordsDB team.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  metadataBase: "https://keywordsdb.com",
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://keywordsdb.com/blog",
    locale: "en_US",
    siteName: "keywordsdb",
    images: {
      url: "https://keywordsdb.com/og-image.png",
      width: 2115,
      height: 1189,
      alt: title,
    },
  },
};

function PostMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Calendar className="h-3 w-3" />
        {new Date(post.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        {post.readingTime}
      </span>
    </div>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  const image = post.coverImage ?? post.ogImage;
  const imageWidth = post.coverImageWidth ?? post.ogImageWidth;
  const imageHeight = post.coverImageHeight ?? post.ogImageHeight;
  const imageAlt = post.coverImageAlt ?? post.ogImageAlt;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40 lg:flex-row"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden lg:aspect-auto lg:h-auto lg:w-[55%]">
        <Image
          src={image}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent to-card/20 lg:block hidden" />
      </div>

      <div className="flex flex-col justify-center gap-4 p-8 lg:p-10">
        <div>
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            Featured
          </span>
          <h2 className="text-2xl font-bold tracking-tight leading-snug transition-colors group-hover:text-primary lg:text-3xl">
            {post.title}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed lg:text-base">
          {post.description}
        </p>
        <div className="flex items-center justify-between pt-2">
          <PostMeta post={post} />
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary translate-x-0 transition-transform group-hover:translate-x-1">
            Read more
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SmallCard({ post }: { post: BlogPost }) {
  const image = post.coverImage ?? post.ogImage;
  const imageWidth = post.coverImageWidth ?? post.ogImageWidth;
  const imageHeight = post.coverImageHeight ?? post.ogImageHeight;
  const imageAlt = post.coverImageAlt ?? post.ogImageAlt;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h2 className="text-lg font-bold tracking-tight leading-snug transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        <p className="flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {post.description}
        </p>
        <div className="flex items-center justify-between pt-1">
          <PostMeta post={post} />
          <ArrowRight className="h-4 w-4 text-primary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

function WideCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/40 sm:flex-row"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-full sm:w-46">
        <Image
          src={post.coverImage ?? post.ogImage}
          alt={post.coverImageAlt ?? post.ogImageAlt}
          width={post.coverImageWidth ?? post.ogImageWidth}
          height={post.coverImageHeight ?? post.ogImageHeight}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col justify-center gap-1.5 px-5 py-3">
        <h2 className="font-semibold tracking-tight leading-snug transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {post.description}
        </p>
        <PostMeta post={post} />
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;
  const grid = rest.slice(0, 3);
  const list = rest.slice(3);

  return (
    <div className="flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Keyword research tips, SEO strategies, and product updates.
          </p>
        </div>

        <div className="container mx-auto max-w-5xl px-4 pb-14">
          {posts.length === 0 && (
            <p className="text-center text-muted-foreground">
              No posts yet. Check back soon!
            </p>
          )}

          {/* Featured post */}
          {featured && (
            <div className="mb-8">
              <FeaturedCard post={featured} />
            </div>
          )}

          {/* 3-column grid */}
          {grid.length > 0 && (
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {grid.map((p) => (
                <SmallCard key={p.slug} post={p} />
              ))}
            </div>
          )}

          {/* Remaining posts as a simple list */}
          {list.length > 0 && (
            <div className="flex flex-col gap-4">
              {list.map((post) => (
                <WideCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
