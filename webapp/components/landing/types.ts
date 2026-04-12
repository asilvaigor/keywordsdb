import type { ReactNode } from "react";
import type { KeywordFilters } from "@/lib/types";

export type HeroTrustBadgeIcon = "credit-card" | "database" | "google";

export type HeroContent = {
  badgeText: string;
  title: string;
  titleClassName?: string;
  description: string;
  cta: {
    href: string;
    label: string;
  };
  trustBadges: {
    icon: HeroTrustBadgeIcon;
    label: string;
  }[];
  annotation?: {
    line1: string;
    line2: string;
  };
  table?: {
    defaultFilters?: KeywordFilters;
  };
  showBackgroundPattern?: boolean;
};

export type VideoContent = {
  description: string;
  title: string;
};

export type PricingContent = {
  description: string;
  title: string;
};

export type FAQItem = {
  answer: ReactNode;
  question: string;
  textAnswer?: string;
};

export type FAQContent = {
  description: string;
  items: FAQItem[];
  title: string;
};

export type FinalCtaContent = {
  cta: {
    href: string;
    label: string;
  };
  description: string;
  titleAccent: string;
  titleTop: string;
};

export type LandingPageContent = {
  faq: FAQContent;
  finalCta: FinalCtaContent;
  hero: HeroContent;
  pricing: PricingContent;
};
