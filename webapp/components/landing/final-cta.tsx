import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 35%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
          Start finding keywords
          <br />
          <span className="text-primary">in seconds</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          10 free searches. No credit card. No setup.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold"
            asChild
          >
            <Link href="/login">
              Try KeywordsDB for Free
              <ArrowRight className="ml-2 h-4 w-4" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
