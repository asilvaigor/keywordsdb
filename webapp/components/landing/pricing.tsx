import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try KeywordsDB risk-free",
    highlight: false,
    badge: null,
    features: [
      "10 keyword searches",
      "All filters & sorting",
      "Full dataset access",
      "No credit card required",
    ],
    cta: "Start Free",
    href: "/login",
  },
  {
    name: "Monthly",
    price: "$9",
    originalPrice: "$18",
    period: "/month",
    description: "For active keyword researchers",
    highlight: true,
    badge: "50% OFF",
    features: [
      "Unlimited searches",
      "All filters & sorting",
      "Full dataset access",
      "CSV/Parquet export",
    ],
    cta: "Start Free Trial",
    href: "/login",
  },
  {
    name: "Yearly",
    price: "$54",
    originalPrice: "$108",
    period: "/year",
    description: "Best value — just $4.50/mo",
    highlight: false,
    badge: "BEST VALUE",
    features: [
      "Everything in Monthly",
      "Priority support",
      "Save 50% vs monthly",
    ],
    cta: "Start Free Trial",
    href: "/login",
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with 10 free searches. No credit card needed.
            <br />
            Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-10 md:gap-6 md:grid-cols-3 pt-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col overflow-visible ${
                plan.highlight
                  ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10 scale-[1.02]"
                  : ""
              }`}
            >
              {plan.badge && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {plan.badge}
                </div>
              )}
              <CardHeader className="pt-6">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    {plan.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  size="lg"
                  asChild
                >
                  <Link href={plan.href}>
                    {plan.highlight && (
                      <Sparkles
                        className="mr-1.5 h-4 w-4"
                        data-icon="inline-start"
                      />
                    )}
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;
