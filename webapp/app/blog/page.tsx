import type { Metadata } from "next";
import PostCard from "@/components/blog/post-card";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { getAllPosts } from "@/lib/blog/posts";

const title = "Blog | KeywordsDB";
const description =
  "Keyword research tips, SEO strategies, case studies, and product updates from the KeywordsDB team to help you find better keywords faster.";

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

export default function BlogPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;
  const grid = rest.slice(0, 2);
  const list = rest.slice(2);

  return (
    <div className="flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Keyword research tips, SEO strategies, case studies, and product
            updates to help you find better keywords faster.
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
            <div className="mb-6">
              <PostCard post={featured} variant="featured" />
            </div>
          )}

          {/* 3-column grid */}
          {grid.length > 0 && (
            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {grid.map((p) => (
                <PostCard key={p.slug} post={p} variant="grid" />
              ))}
            </div>
          )}

          {/* Remaining posts as a simple list */}
          {list.length > 0 && (
            <div className="flex flex-col gap-6 sm:gap-3">
              {list.map((post) => (
                <PostCard key={post.slug} post={post} variant="list" />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
