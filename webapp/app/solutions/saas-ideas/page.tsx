import Footer from "@/components/footer";
import Header from "@/components/header";
import { BreadcrumbJsonLD, FAQJsonLD } from "@/components/json-ld";
import FAQ from "@/components/landing/faq";
import FinalCTA from "@/components/landing/final-cta";
import Hero from "@/components/landing/hero";
import Pricing from "@/components/landing/pricing";
import type { LandingPageContent } from "@/components/landing/types";
import Video from "@/components/landing/video";
import SaasIdeasHowItWorks from "@/components/saas-ideas/how-it-works";
import SaasIdeasProblemSolution from "@/components/saas-ideas/problem-solution";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Find micro SaaS ideas using Google data | KeywordsDB",
  description:
    "Find niche SaaS ideas based on real Google search demand. Explore 11M+ high potential keywords and validate opportunities by volume, CPC and competition.",
  canonicalUrl: "/solutions/saas-ideas",
});

const saasIdeasLandingContent: LandingPageContent = {
  hero: {
    badgeText: "Over 11 million keywords with SaaS potential",
    title: "Find niche SaaS ideas hidden in Google's search data",
    titleClassName: "text-3xl md:text-4xl lg:text-5xl",
    description:
      "Skip $100+ idea directories filled with recycled lists. Search 11M+ high-potential keywords, filter by demand and surface untapped software opportunities.",
    cta: {
      href: "/login",
      label: "Explore SaaS ideas for Free",
    },
    trustBadges: [
      { icon: "database", label: "11M+ high-potential keywords" },
      { icon: "google", label: "Real Google Search data" },
      { icon: "credit-card", label: "No credit card required" },
    ],
    annotation: {
      line1: "Sample demo",
      line2: "20 SaaS ideas",
    },
    table: { defaultFilters: { saas_potential: "high" } },
  },
  pricing: {
    title: "Cheaper than one stale idea directory",
    description:
      "Most idea directories charge $100+ for a static spreadsheet. KeywordsDB starts free and gives you a searchable database of SaaS opportunities for a fraction of that.",
  },
  faq: {
    title: "Frequently asked questions",
    description:
      "Everything you need to know about using KeywordsDB to find SaaS ideas.",
    items: [
      {
        question: "What is KeywordsDB?",
        answer:
          "KeywordsDB is a powerful keyword research tool that gives you direct access to 300M+ keywords from Google Search. It is the ideal tool for SEO optimization, content strategy, PPC campaigns, and market research. With KeywordsDB, you can search, filter, and sort keywords by volume, CPC, and competition to find hidden opportunities and grow your organic traffic.",
      },
      {
        question: "Where does the keyword data come from?",
        answer:
          "All keyword data comes directly from the Google Ads API — the same data advertisers use to plan their campaigns. The database is updated every few days with fresh data from Google Ads.",
      },
      {
        question: "Why is this better than paying for an idea directory?",
        answer:
          "Directories give you a fixed list that everyone else can buy. KeywordsDB lets you search the underlying demand, sort by metrics, and uncover niches those lists never include.",
      },
      {
        question: "Can I use it without a seed keyword?",
        answer:
          "Yes. That is the main advantage of this workflow. Start with the high SaaS-potential filter, then browse by volume, CPC, competition, and intent until a category stands out.",
      },
      {
        question: "How do I validate whether an idea is worth building?",
        answer:
          "Use search volume to confirm recurring demand, CPC to gauge commercial value, competition to estimate how crowded the space is, and trend history to see whether interest is stable or growing.",
      },
      {
        question: "Who is this useful for?",
        answer:
          "Founders, indie hackers, product teams, consultants, and agencies use it to find SaaS niches, content angles, lead magnets, and adjacent product opportunities backed by search demand.",
      },
    ],
  },
  finalCta: {
    titleTop: "Don't pick from a list.",
    titleAccent: "Search the market instead",
    description: "10 free searches. No credit card. No setup.",
    cta: {
      href: "/login",
      label: "Explore SaaS ideas for Free",
    },
  },
};

function SaasIdeasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <FAQJsonLD items={saasIdeasLandingContent.faq.items} />
      <BreadcrumbJsonLD
        items={[
          { name: "Home", url: "https://keywordsdb.com" },
          {
            name: "SaaS Ideas",
            url: "https://keywordsdb.com/solutions/saas-ideas",
          },
        ]}
      />
      <Header />
      <main className="flex-1">
        <Hero content={saasIdeasLandingContent.hero} />
        <SaasIdeasProblemSolution />
        <SaasIdeasHowItWorks />
        <Video />
        <Pricing content={saasIdeasLandingContent.pricing} />
        <FAQ content={saasIdeasLandingContent.faq} />
        <FinalCTA content={saasIdeasLandingContent.finalCta} />
      </main>
      <Footer />
    </div>
  );
}

export default SaasIdeasPage;
