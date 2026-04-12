"use client";

import { CreditCard, RefreshCcw, Shield, Star } from "lucide-react";
import KeyLock from "@/components/icons/key-lock";
import { FAQAccordion } from "@/components/landing/faq";
import { PricingCards } from "@/components/landing/pricing";

export const trustFeatures = [
  {
    icon: Shield,
    label: "Secure payments via Stripe",
  },
  {
    icon: RefreshCcw,
    label: "Cancel anytime, no lock-in",
  },
  {
    icon: CreditCard,
    label: "7-day money-back guarantee",
  },
  {
    icon: Star,
    label: "300M+ keywords available",
  },
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. Both monthly and yearly plans can be cancelled at any time with no questions asked. You'll continue to have access until the end of your billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, Amex) through Stripe. All payments are processed securely.",
  },
  {
    question: "What happens after I subscribe?",
    answer:
      "You'll get instant access to unlimited keyword searches. Your subscription starts immediately and renews automatically.",
  },
  {
    question: "Is there a money-back guarantee?",
    answer:
      "Yes! If you're not satisfied within the first 7 days of your subscription, contact us for a full refund — no questions asked.",
  },
];

function Paywall({ email }: { email: string }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6">
      {/* Hero section */}
      <div className="flex flex-col items-center text-center mb-6">
        <KeyLock className="w-24" />

        <h1 className="font-bold tracking-tight text-2xl">
          You&apos;ve used your 10 free searches
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Great research so far! Upgrade to keep searching 300M+ keywords with
          all the filters and sorting you love.
        </p>
      </div>

      {/* Plans */}
      <div className="mb-14">
        <PricingCards isPaywall email={email} />
      </div>

      {/* Trust signals */}
      <div className="mb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustFeatures.map((feature) => (
            <div
              key={feature.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-muted/30 p-4 text-center"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground leading-tight">
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-center mb-6">
          Questions about billing?
        </h2>
        <FAQAccordion items={faqs} />
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 mb-4 text-center">
        <p className="text-sm text-muted-foreground">
          Need help deciding?{" "}
          <a
            href="/contact"
            className="text-primary underline-offset-4 hover:underline"
          >
            Contact us
          </a>{" "}
          — we&apos;re happy to help.
        </p>
      </div>
    </div>
  );
}

export default Paywall;
