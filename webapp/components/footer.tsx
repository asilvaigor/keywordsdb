import { Box } from "lucide-react";
import Image from "next/image";
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
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-1 w-44">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <Box className="h-4 w-4" />
              <span className="font-semibold text-foreground">KeywordsDB</span>
            </Link>
            <Link
              href="https://startupfa.me/s/keywordsdb?utm_source=keywordsdb.com"
              target="_blank"
            >
              <Image
                src="/badges/startupfame.webp"
                alt="KeywordsDB - Featured on Startup Fame"
                width={655}
                height={105}
                className="border rounded-md"
              />
            </Link>
            <Link href="https://fazier.com/launches/keywordsdb" target="_blank">
              <Image
                src="/badges/fazier.svg"
                alt="Fazier badge"
                width={182}
                height={43}
              />
            </Link>
            <Link href="https://twelve.tools" target="_blank">
              <Image
                src="/badges/twelve-tools.svg"
                alt="Featured on Twelve Tools"
                width={200}
                height={54}
              />
            </Link>
          </div>

          {/* Product */}
          <div className="space-y-3 text-sm">
            <p className="font-medium text-foreground">Product</p>
            <div className="flex flex-col gap-2">
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/login">Dashboard</FooterLink>
              <FooterLink href="/#pricing">Pricing</FooterLink>
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-3 text-sm">
            <p className="font-medium text-foreground">Solutions</p>
            <div className="flex flex-col gap-2">
              <FooterLink href="/solutions/saas-ideas">SaaS Ideas</FooterLink>
              <FooterLink href="/density-checker">Density Checker</FooterLink>
              <FooterLink href="/seo-audit">SEO Audit</FooterLink>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-3 text-sm">
            <p className="font-medium text-foreground">Company</p>
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
