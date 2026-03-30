import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  coverImage?: string;
  coverImageWidth?: number;
  coverImageHeight?: number;
  coverImageAlt?: string;
  ogImage: string;
  ogImageWidth: number;
  ogImageHeight: number;
  ogImageAlt: string;
  description: string;
  date: string;
  readingTime: string;
  relatedBlogPosts?: string[];
};

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

function parsePost(slug: string): BlogPost {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  return { slug, ...data } as BlogPost;
}

export function getAllPosts(): BlogPost[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => parsePost(f.replace(/\.mdx$/, "")))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): BlogPost | undefined {
  try {
    return parsePost(slug);
  } catch {
    return undefined;
  }
}
