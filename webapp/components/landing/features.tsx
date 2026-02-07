import {
  ArrowUpDown,
  Download,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "Smart Keyword Search",
    description: "Search across 300M keywords instantly with string matching.",
  },
  {
    icon: SlidersHorizontal,
    title: "Advanced Filters",
    description:
      "Filter by volume range, CPC, competition — combine multiple filters for precision.",
  },
  {
    icon: ArrowUpDown,
    title: "Sort & Compare",
    description:
      "Sort by any metric to find high-volume, low-competition keyword gems.",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    description:
      "Streaming results powered by state-of-the art database — results appear in real-time.",
  },
  {
    icon: TrendingUp,
    title: "Historical Data",
    description:
      "See how keyword search volumes change over time to spot trends.",
  },
  {
    icon: Download,
    title: "Export to CSV",
    description: "Download your filtered keyword results to analyze offline.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need for
            <span className="text-primary"> keyword research</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            No bloated tools. No confusing dashboards. Just the data you need to
            make better SEO decisions.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-transparent bg-muted/30 transition-colors hover:border-primary/20 hover:bg-muted/50"
            >
              <CardContent className="pt-2">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
