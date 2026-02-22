import { ArrowRight, CreditCard, Database, Sparkles } from "lucide-react";
import Link from "next/link";
import { CurvedArrow } from "@/components/icons/curved-arrow";
import { Button } from "@/components/ui/button";
import { Google } from "../icons/google";
import { KeywordsTable } from "../keywords-table";

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-18 md:pb-24">
      {/* Background pattern */}
      <div className="pointer-events-none absolute -inset-2.5 -z-10 overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Fade out bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 50% at 50% 0%, transparent 50%, var(--background) 100%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Over 300 Million Keywords from Google</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Every keyword.
          <br />
          <span className="">One search away.</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Search, filter, and sort 300M+ Google keywords by volume, CPC, and
          competition. Find your next opportunity in seconds.
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="h-13 px-10 text-base font-semibold shadow-lg shadow-primary/30"
            asChild
          >
            <Link href="/login">
              Explore Keywords for Free
              <ArrowRight className="ml-2 h-4 w-4" data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5" /> 300M+ keywords
          </span>
          <span className="flex items-center gap-1">
            <Google className="w-3.5 h-3.5" variant="mono" /> Real Google Search
            data
          </span>
          <span className="flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> No credit card required
          </span>
        </div>

        {/* Product demo */}
        <div className="relative max-w-fit mx-auto mt-16">
          {/* Scribbled arrow annotation */}
          <div className="absolute -top-12 right-4 z-10">
            <p className="text-primary -rotate-5 font-(family-name:--font-fuzzy-bubbles)">
              Sample demo
            </p>
            <div className="absolute -right-5 top-3 w-5 text-primary">
              <CurvedArrow />
            </div>
          </div>

          <div className="relative rounded-xl border bg-card p-2 ring-1 ring-primary/10">
            <div className="flex items-center gap-2 px-2 pb-2">
              <div className="absolute flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
                <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="flex-1 text-center">
                <div className="mx-auto inline-flex items-center gap-1 rounded-md bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                  keywordsdb.com
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-background py-4 px-4 text-left">
              <KeywordsTable isSample={true} canDownload={true} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
