import Link from "next/link";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { FAQJsonLD } from "@/components/json-ld";
import Benefits from "@/components/landing/benefits";
import FAQ from "@/components/landing/faq";
import FinalCTA from "@/components/landing/final-cta";
import Hero from "@/components/landing/hero";
import Pricing from "@/components/landing/pricing";
import Stats from "@/components/landing/stats";
import type { LandingPageContent } from "@/components/landing/types";
import Video from "@/components/landing/video";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Free Keyword Research Tool | KeywordsDB",
  description:
    "Get full access to 300M+ keywords for data-driven research. Search, filter and sort them by volume, CPC, and competition.",
  canonicalUrl: "/",
});

const homeLandingContent: LandingPageContent = {
  hero: {
    badgeText: "Over 300 Million Keywords from Google",
    title: "Explore Google's search data",
    description:
      "Full access to 300M+ keywords for data-driven research. Search, filter and sort them by volume, CPC, and competition.",
    cta: {
      href: "/login",
      label: "Explore Keywords for Free",
    },
    trustBadges: [
      { icon: "database", label: "300M+ keywords" },
      { icon: "google", label: "Real Google Search data" },
      { icon: "credit-card", label: "No credit card required" },
    ],
    annotation: {
      line1: "Sample demo",
      line2: "1000 keywords",
    },
  },
  pricing: {
    title: "Simple, transparent pricing",
    description:
      "Start with 10 free searches. No credit card needed. Upgrade when you're ready.",
  },
  faq: {
    title: "Frequently asked questions",
    description: "Everything you need to know about KeywordsDB.",
    items: [
      {
        question: "What is KeywordsDB?",
        answer:
          "KeywordsDB is a powerful keyword research tool that gives you direct access to 300M+ keywords from Google Search. It is the ideal tool for SEO optimization, content strategy, PPC campaigns, and market research. With KeywordsDB, you can search, filter, and sort keywords by volume, CPC, competition, intent, category, SaaS Potential and more to find hidden opportunities and grow your organic traffic.",
      },
      {
        question: "Where does the keyword data come from?",
        answer:
          "All keyword data comes directly from the Google Ads API — the same data advertisers use to plan their campaigns. The database is updated every few days with fresh data from Google Ads.",
      },
      {
        question: "Can I trust the data?",
        answer: (
          <span>
            We made a dedicated blog post about this! Check it out at{" "}
            <Link
              href="/blog/can-you-trust-data-from-keyword-research-tools"
              target="_blank"
              className="text-primary"
            >
              our blog
            </Link>
            .
          </span>
        ),
        textAnswer:
          "We made a dedicated blog post about this! Check it out at our blog: https://keywordsdb.com/blog/can-you-trust-data-from-keyword-research-tools",
      },
      {
        question: "How is this different from other keyword tools?",
        answer:
          "Most keyword tools charge $99+/month and bury the data behind complex dashboards, with limited filter options. KeywordsDB gives you direct access to the raw Google Search data in a fast, searchable table — at a fraction of the cost.",
      },
      {
        question: "Do I need a credit card to start?",
        answer:
          "No! You can start using KeywordsDB immediately with 10 free searches — no credit card required. Just create an account and start searching for free.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Absolutely. Both monthly and yearly plans can be cancelled at any time with no questions asked. You'll continue to have access until the end of your billing period.",
      },
    ],
  },
  finalCta: {
    titleTop: "Start finding keywords",
    titleAccent: "in seconds",
    description: "10 free searches. No credit card. No setup.",
    cta: {
      href: "/login",
      label: "Try KeywordsDB for Free",
    },
  },
};

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <FAQJsonLD items={homeLandingContent.faq.items} />
      <Header />
      <main className="flex-1">
        <Hero content={homeLandingContent.hero} />
        <Stats />
        <Benefits />
        <Video />
        <Pricing content={homeLandingContent.pricing} />
        <FAQ content={homeLandingContent.faq} />
        <FinalCTA content={homeLandingContent.finalCta} />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
