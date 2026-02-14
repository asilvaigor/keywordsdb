import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const title = "Free Keyword Research Tool | KeywordsDB";
const description =
  "Filter Google keywords by search volume, CPC and competition data. Find SaaS ideas and trends for free to improve your SEO and online marketing.";

export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/" },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: "https://keywordsdb.com",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} dark`}
      suppressHydrationWarning
    >
      <body>
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
