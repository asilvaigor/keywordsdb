"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { checkout } from "@/lib/stripe/checkout";
import { cn } from "@/lib/utils";

export const plans = [
  {
    name: "Free",
    monthly: { price: "$0" },
    yearly: { price: "$0" },
    description: "Try KeywordsDB risk-free",
    highlight: false,
    badge: null,
    checkoutOption: null as null,
    features: [
      "10 free searches",
      "No credit card required",
      "Full dataset access",
    ],
  },
  {
    name: "Pro",
    monthly: { price: "$9", originalPrice: "$18" },
    yearly: {
      price: "$4.50",
      originalPrice: "$9",
      totalPrice: "$54",
    },
    description: "For active keyword researchers",
    highlight: true,
    badge: "50% OFF",
    checkoutOption: "pro" as const,
    features: [
      "Unlimited searches",
      "Full dataset access",
      "All filters & sorting",
    ],
  },
  {
    name: "Max",
    monthly: { price: "$14", originalPrice: "$28" },
    yearly: {
      price: "$7",
      originalPrice: "$14",
      totalPrice: "$84",
    },
    description: "For agencies & SEO professionals",
    highlight: false,
    badge: null,
    checkoutOption: "max" as const,
    features: [
      "Everything in Pro",
      "CSV/Parquet export",
      "Access to Bing data",
    ],
  },
];

function BillingToggle({
  isYearly,
  onChange,
}: {
  isYearly: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Label
        htmlFor="billing-toggle"
        className={cn(
          "text-sm cursor-pointer",
          !isYearly ? "text-foreground font-medium" : "text-muted-foreground",
        )}
      >
        Monthly
      </Label>
      <Switch
        id="billing-toggle"
        checked={isYearly}
        onCheckedChange={onChange}
      />
      <Label
        htmlFor="billing-toggle"
        className={cn(
          "text-sm cursor-pointer",
          isYearly ? "text-foreground font-medium" : "text-muted-foreground",
        )}
      >
        Yearly
      </Label>
    </div>
  );
}

export function PricingCards({
  isPaywall = false,
  email,
}: {
  isPaywall?: boolean;
  email?: string;
}) {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const columns = isPaywall ? 2 : 3;
  const plansToShow = isPaywall ? plans.slice(1) : plans;

  function handleCheckout(plan: (typeof plans)[number]) {
    if (!plan.checkoutOption || !email) return;
    const option =
      `${plan.checkoutOption}_${isYearly ? "yearly" : "monthly"}` as
        | "pro_monthly"
        | "pro_yearly"
        | "max_monthly"
        | "max_yearly";
    setLoadingPlan(plan.name);
    startTransition(async () => {
      const result = await checkout({ email, checkoutOption: option });
      if (result?.error) {
        toast.error(result.error);
        setLoadingPlan(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <BillingToggle isYearly={isYearly} onChange={setIsYearly} />

      <div
        className={cn("mx-auto grid gap-10 md:gap-6 w-full max-w-4xl", {
          "md:grid-cols-2": columns === 2,
          "md:grid-cols-3": columns === 3,
        })}
      >
        {plansToShow.map((plan) => {
          const pricing = isYearly ? plan.yearly : plan.monthly;
          const isPaid = plan.name !== "Free";

          return (
            <Card
              key={plan.name}
              className={cn("relative flex flex-col overflow-visible", {
                "border-primary ring-2 ring-primary/20 scale-[1.02]":
                  plan.highlight && columns === 3,
                "border-primary ring-2 ring-primary/20":
                  plan.highlight && columns === 2,
              })}
            >
              {plan.badge && (
                <div
                  className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold",
                    {
                      "bg-primary text-primary-foreground": plan.highlight,
                      "bg-muted text-foreground": !plan.highlight,
                    },
                  )}
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
                    {pricing.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {pricing.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold">{pricing.price}</span>
                    {isPaid && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  {isYearly && isPaid && plan.yearly.totalPrice && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Billed yearly at {plan.yearly.totalPrice}
                    </p>
                  )}
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
                {isPaywall && plan.checkoutOption ? (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    size="lg"
                    disabled={isPending}
                    onClick={() => handleCheckout(plan)}
                  >
                    {loadingPlan === plan.name && (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    )}
                    Subscribe
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <Link href="/login">Start Free Trial</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center my-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with 10 free searches. No credit card needed.
            <br />
            Upgrade when you&apos;re ready.
          </p>
        </div>

        <PricingCards />
      </div>
    </section>
  );
}

export default Pricing;
