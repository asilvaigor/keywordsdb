import {
  ArrowRight,
  ChartNoAxesCombined,
  CreditCard,
  Database,
} from "lucide-react";
import Link from "next/link";
import { CurvedArrow } from "@/components/icons/curved-arrow";
import type {
  HeroContent,
  HeroTrustBadgeIcon,
} from "@/components/landing/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Google } from "../icons/google";
import { KeywordsTable } from "../keywords-table";

function renderTrustBadgeIcon(icon: HeroTrustBadgeIcon) {
  switch (icon) {
    case "credit-card":
      return <CreditCard className="w-3.5 h-3.5" />;
    case "database":
      return <Database className="w-3.5 h-3.5" />;
    case "google":
      return <Google className="w-3.5 h-3.5" variant="mono" />;
  }
}

function Hero({ content }: { content: HeroContent }) {
  const showBackgroundPattern = content.showBackgroundPattern ?? true;

  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-18 md:pb-24">
      {showBackgroundPattern && (
        <div className="pointer-events-none absolute -inset-2.5 -z-10 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--secondary) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
      )}

      <div className="container mx-auto px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
          <ChartNoAxesCombined className="h-3.5 w-3.5" />
          <span>{content.badgeText}</span>
        </div>

        <h1
          className={cn(
            "mx-auto font-bold tracking-tight max-w-4xl",
            content.titleClassName ??
              "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
          )}
        >
          {content.title}
        </h1>

        <p className="mx-auto mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl">
          {content.description}
        </p>

        <div className="mt-8 flex items-center justify-center">
          <Button
            size="lg"
            className="h-13 px-10 text-base font-semibold"
            asChild
          >
            <Link href={content.cta.href}>
              {content.cta.label}
              <ArrowRight className="ml-2 h-4 w-4" data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {content.trustBadges.map((badge) => (
            <span
              key={`${badge.icon}-${badge.label}`}
              className="flex items-center gap-1"
            >
              {renderTrustBadgeIcon(badge.icon)}
              {badge.label}
            </span>
          ))}
        </div>

        <div className="relative max-w-fit mx-auto mt-16">
          {content.annotation && (
            <div className="absolute -top-14 right-4 z-10">
              <p className="text-primary -rotate-5 font-(family-name:--font-fuzzy-bubbles)">
                {content.annotation.line1}
                <br />
                {content.annotation.line2}
              </p>
              <div className="absolute -right-5 top-6 w-5 text-primary">
                <CurvedArrow />
              </div>
            </div>
          )}

          <div className="relative border bg-card p-2 ring-1 ring-primary/10 rounded-xl">
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
            <div className="bg-background text-left rounded-lg px-4 py-4">
              <KeywordsTable
                isSample
                isMaxPlan
                defaultFilters={content.table?.defaultFilters}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
