import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { FinalCtaContent } from "@/components/landing/types";
import { Button } from "@/components/ui/button";

function FinalCTA({ content }: { content: FinalCtaContent }) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--secondary) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          {content.titleTop}
          <br />
          <span className="text-primary">{content.titleAccent}</span>
        </h2>
        <p className="mx-auto mt-4 text-lg text-muted-foreground max-w-md">
          {content.description}
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold"
            asChild
          >
            <Link href={content.cta.href}>
              {content.cta.label}
              <ArrowRight className="ml-2 h-4 w-4" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
