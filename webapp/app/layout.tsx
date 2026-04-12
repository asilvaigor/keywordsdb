import { Fuzzy_Bubbles, JetBrains_Mono, Outfit } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ variable: "--font-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const fuzzyBubbles = Fuzzy_Bubbles({
  weight: "400",
  variable: "--font-fuzzy-bubbles",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        outfit.variable,
        jetbrainsMono.variable,
        fuzzyBubbles.variable,
      )}
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
