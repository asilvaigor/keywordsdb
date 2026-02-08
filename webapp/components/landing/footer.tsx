import { Box } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4" />
          <span className="font-medium text-foreground">KeywordsDB</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <Link href="/tos" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <a
            href="mailto:support@keywordsdb.com"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
