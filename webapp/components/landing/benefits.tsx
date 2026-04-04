import {
  ArrowUpDown,
  Download,
  Lightbulb,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Lightbulb,
    title: "Find low-competition keywords",
    description:
      "Sort and compare metrics to instantly surface high-volume, low-competition keyword gems.",
  },
  {
    icon: Search,
    title: "Discover Hidden Opportunities",
    description:
      "Start with no keyword at all. Explore the data in your own way and discover opportunities even when you don't know what to search for.",
  },
  {
    icon: ArrowUpDown,
    title: "Spot the Best SEO Opportunities",
    description:
      "Compare keywords side-by-side to quickly identify the most promising opportunities for your content strategy.",
  },
  {
    icon: Zap,
    title: "Research Keywords Without Waiting",
    description:
      "Results stream in real time, so you can explore massive datasets without slow loading or clunky dashboards.",
  },
  {
    icon: TrendingUp,
    title: "Catch Trends Before Competitors",
    description:
      "Analyze historical search volumes to find growing topics before they become saturated.",
  },
  {
    icon: Download,
    title: "Use Your Data Anywhere",
    description:
      "Export clean keyword datasets to CSV or Parquet for deeper analysis, automation, or AI workflows.",
  },
];

function Benefits() {
  return (
    <section id="benefits" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Find profitable keywords
            <span className="text-primary"> in seconds</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Skip slow SEO tools and messy dashboards. Instantly search 300M
            keywords and uncover opportunities your competitors are missing.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <Card
              key={benefit.title}
              className="border-transparent bg-muted/30 transition-colors hover:border-primary/20 hover:bg-muted/50"
            >
              <CardContent className="pt-2">
                <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold">{benefit.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Benefits;
