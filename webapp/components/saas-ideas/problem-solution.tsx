import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const painCards = [
  {
    eyebrow: "Manual ideas",
    title: "Brainstorm it yourself",
    description:
      "Feels creative, but you are still stuck inside your own mental map.",
    bullets: [
      "Small idea pool",
      "No validated demand",
      "Feasibility gets fuzzy fast",
    ],
    className: "lg:w-[88%] lg:-rotate-[2deg]",
  },
  {
    eyebrow: "Typical directory",
    title: "Pay for the list",
    description:
      "Cleaner packaging, same limitation: it is still a fixed shortlist everyone can buy.",
    bullets: [
      "Very small idea pool",
      "Static spreadsheet",
      "Everyone gets the same ideas",
    ],
    className: "lg:ml-10 lg:w-[84%] lg:rotate-[2deg]",
  },
];

const keywordDbAdvantages = [
  {
    title: "Start with demand",
    description:
      "Search 11M+ SaaS-relevant keywords instead of staring at a blank page.",
  },
  {
    title: "Validate fast",
    description:
      "Use volume, CPC, and competition to separate signal from wishful thinking.",
  },
  {
    title: "Keep digging",
    description:
      "Once something clicks, study the market and branch into adjacent terms.",
  },
];

function SaasIdeasProblemSolution() {
  return (
    <section id="problem" className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            A fixed list runs out. Search demand does not.
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            Instead of picking from the same recycled ideas, explore a much
            larger pool of keywords and uncover niche software opportunities
            with real signal.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4 lg:py-6">
            {painCards.map((card) => (
              <Card
                key={card.title}
                className={`border-destructive/15 bg-destructive/5 ${card.className}`}
              >
                <CardContent className="p-5 md:p-6">
                  <p className="text-xs font-semibold tracking-[0.22em] text-destructive uppercase">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>

                  <div className="mt-5 space-y-2.5">
                    {card.bullets.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-full bg-destructive/10 p-1 text-destructive">
                          <X className="h-3 w-3" />
                        </span>
                        <p className="text-sm text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-success/15 bg-success/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-success uppercase">
                    KeywordsDB
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    Search the market instead
                  </h3>
                </div>

                <span className="rounded-full bg-success/10 p-2 text-success">
                  <Check className="h-4 w-4" />
                </span>
              </div>

              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                Start from real demand, not from guesswork or somebody else's
                spreadsheet. Search broad, validate fast, then narrow into an
                opportunity that actually looks buildable.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "11M+ SaaS-relevant keywords",
                  "No seed keyword needed",
                  "Free to start",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-success/15 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {keywordDbAdvantages.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-success/15 bg-background/60 px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full bg-success/10 p-1 text-success">
                        <Check className="h-3 w-3" />
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold">{item.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm font-medium text-foreground">
                Less list shopping. More pattern spotting.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default SaasIdeasProblemSolution;
