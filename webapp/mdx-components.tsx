import { ArrowRight } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import React from "react";
import { KeywordsTable } from "@/components/keywords-table";
import { Button } from "@/components/ui/button";

function CTAButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="not-prose">
      <Button size="lg" className="font-semibold" asChild>
        <Link href={href}>
          {children}
          <ArrowRight className="ml-2 h-4 w-4" data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  );
}

function stripWhitespace(children: React.ReactNode) {
  return React.Children.map(children, (child) =>
    typeof child === "string" && !child.trim() ? null : child,
  );
}

function NotProseKeywordsTable(
  props: React.ComponentProps<typeof KeywordsTable>,
) {
  return (
    <div className="not-prose">
      <KeywordsTable {...props} />
    </div>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    KeywordsTable: NotProseKeywordsTable,
    CTAButton,
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-s-border [&>p:first-of-type]:before:content-none [&>p:last-of-type]:after:content-none"
        {...props}
      >
        {children}
      </blockquote>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table {...props}>{stripWhitespace(children)}</table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="border-border border-b-2" {...props}>
        {stripWhitespace(children)}
      </thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="border-border" {...props}>
        {stripWhitespace(children)}
      </tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr className="border-border" {...props}>
        {stripWhitespace(children)}
      </tr>
    ),
    th: ({ children, ...props }) => (
      <th className="border-border" {...props}>
        {stripWhitespace(children)}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border-border" {...props}>
        {stripWhitespace(children)}
      </td>
    ),
  };
}
