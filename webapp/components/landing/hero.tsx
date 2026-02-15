import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { CurvedArrow } from "@/components/landing/curved-arrow";
import { Button } from "@/components/ui/button";
import { KeywordsTable } from "../keywords-table";

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-18 md:pb-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-125 w-200 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Over 300 Million Keywords from Google</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Every keyword.
          <br />
          <span className="text-primary">One search away.</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Search, filter, and sort 300M+ Google keywords by volume, CPC, and
          competition. Find your next opportunity in seconds.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold"
            asChild
          >
            <Link href="/login">
              Explore Keywords Free
              <ArrowRight className="ml-2 h-4 w-4" data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base"
            asChild
          >
            <a href="#pricing">See Pricing</a>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-primary">✦</span> 300M+ keywords
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-primary">✦</span> Real Google Search data
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-primary">✦</span> No credit card required
          </span>
        </div>

        {/* Product demo */}
        <div className="relative mx-auto mt-16">
          {/* Scribbled arrow annotation */}
          <div className="absolute -top-12 right-4 z-10">
            <p className="text-primary -rotate-5 font-(family-name:--font-fuzzy-bubbles)">
              Sample demo
            </p>
            <div className="absolute -right-5 top-3 w-5 text-primary">
              <CurvedArrow />
            </div>
          </div>

          <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl" />
          <div className="relative rounded-xl border bg-card p-2 shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
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
              <KeywordsTable isSample={true} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
