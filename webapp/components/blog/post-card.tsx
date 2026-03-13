import { ArrowRight, Calendar, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog/posts";
import { cn } from "@/lib/utils";

function PostMeta({
  post,
  stacked = false,
}: {
  post: BlogPost;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex text-xs text-muted-foreground",
        stacked ? "flex-col gap-1.5" : "flex-row items-center gap-4",
      )}
    >
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

function PostCard({
  post,
  variant = "grid",
}: {
  post: BlogPost;
  variant?: "featured" | "grid" | "list";
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/40",
        variant === "featured" && "lg:flex-row",
        variant === "list" && "sm:flex-row",
      )}
    >
      <div
        className={cn(
          "relative aspect-video w-full shrink-0 overflow-hidden",
          variant === "featured" && "lg:aspect-auto lg:h-auto lg:w-[55%]",
          variant === "list" && "sm:aspect-auto sm:h-full sm:w-46",
        )}
      >
        <Image
          src={post.coverImage ?? post.ogImage}
          alt={post.coverImageAlt ?? post.ogImageAlt}
          width={post.coverImageWidth ?? post.ogImageWidth}
          height={post.coverImageHeight ?? post.ogImageHeight}
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
            variant === "list" && "max-h-30",
          )}
          preload={variant === "featured"}
        />
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-6",
          variant === "featured" && "lg:justify-center lg:gap-4 lg:p-10",
          variant === "list" && "sm:justify-center sm:gap-1.5 sm:px-5 sm:py-3",
        )}
      >
        {variant === "featured" && (
          <div>
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
              Featured
            </span>
            <h2 className="text-2xl font-bold tracking-tight leading-snug transition-colors group-hover:text-primary lg:text-3xl">
              {post.title}
            </h2>
          </div>
        )}
        {variant !== "featured" && (
          <h2
            className={cn(
              "font-bold tracking-tight leading-snug transition-colors group-hover:text-primary",
              variant === "grid" ? "text-lg" : "text-base sm:font-semibold",
            )}
          >
            {post.title}
          </h2>
        )}
        <p
          className={cn(
            "text-sm text-muted-foreground leading-relaxed line-clamp-3",
            variant === "featured" && "lg:text-base lg:line-clamp-none",
            variant === "grid" && "flex-1",
            variant === "list" && "sm:text-xs sm:line-clamp-2",
          )}
        >
          {post.description}
        </p>
        <div
          className={cn(
            "flex items-end justify-between",
            variant === "featured" ? "pt-2" : "pt-1",
          )}
        >
          <PostMeta post={post} stacked={variant === "grid"} />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-medium text-primary transition-transform group-hover:translate-x-1",
              variant === "list" ? "text-xs" : "text-sm",
            )}
          >
            Read more
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default PostCard;
