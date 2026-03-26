import { Box } from "lucide-react";
import Link from "next/link";

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Box className="h-4 w-4" />
              <span className="font-semibold text-foreground">KeywordsDB</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Keyword research powered by Google Ads data.
            </p>
            {/* Featured-in badges go here */}
          </div>

          {/* Product */}
          <div className="space-y-3 text-sm">
            <h4 className="font-medium text-foreground">Product</h4>
            <div className="flex flex-col gap-2">
              <FooterLink href="/login">Dashboard</FooterLink>
              <FooterLink href="/#pricing">Pricing</FooterLink>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3 text-sm">
            <h4 className="font-medium text-foreground">Content</h4>
            <div className="flex flex-col gap-2">
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/density-checker">Density Checker</FooterLink>
              <FooterLink href="/seo-audit">SEO Audit</FooterLink>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-3 text-sm">
            <h4 className="font-medium text-foreground">Company</h4>
            <div className="flex flex-col gap-2">
              <FooterLink href="/contact">Contact</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/tos">Terms</FooterLink>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          &#169; {new Date().getFullYear()} KeywordsDB. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
