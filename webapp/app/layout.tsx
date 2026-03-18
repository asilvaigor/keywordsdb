import type { Metadata } from "next";
import { Fuzzy_Bubbles, Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ variable: "--font-sans" });
const fuzzyBubbles = Fuzzy_Bubbles({
  weight: "400",
  variable: "--font-fuzzy-bubbles",
});

const title = "Free Keyword Research Tool | KeywordsDB";
const description =
  "Get full access to 290M+ keywords for data-driven research. Search, filter and sort them by volume, CPC, and competition.";

export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/" },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: "/",
    locale: "en_US",
    siteName: "keywordsdb",
    images: {
      url: "/og-image.png",
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
      className={cn("dark", outfit.variable, fuzzyBubbles.variable)}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <TooltipProvider delayDuration={200}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster theme="dark" richColors />
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
