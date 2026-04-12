import { Search, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: SlidersHorizontal,
    step: "01",
    title: "Choose the right filters first",
    description:
      "Start with high SaaS potential, then narrow the pool with volume ranges, CPC, competition, and other filters until the results feel worth exploring.",
  },
  {
    icon: Search,
    step: "02",
    title: "Research topics that look promising",
    description:
      "Go through the topics that stand out, pick one that feels interesting, and do a quick Google check for competitors, existing products, and signs the niche has potential.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Build out the niche and SEO angle",
    description:
      "Once a topic passes the sniff test, expand into adjacent terms and long-tail keywords so you can shape the niche and sketch an SEO strategy around it.",
  },
];

function SaasIdeasHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start broad, narrow the field with filters, sanity-check what looks
            promising, and then turn one good topic into a real niche with SEO
            upside.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="bg-muted/25">
              <CardContent className="pt-2">
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-[0.25em] text-primary/80">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SaasIdeasHowItWorks;
