import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is KeywordsDB?",
    answer:
      "KeywordsDB is a powerful keyword research tool that gives you direct access to 290M+ keywords from Google Search. It is the ideal tool for SEO optimization, content strategy, PPC campaigns, and market research. With KeywordsDB, you can search, filter, and sort keywords by volume, CPC, and competition to find hidden opportunities and grow your organic traffic.",
  },
  {
    question: "Where does the keyword data come from?",
    answer:
      "All keyword data comes directly from the Google Ads API — the same data advertisers use to plan their campaigns. This includes real search volume, CPC bids, and competition scores for 290M+ English keywords.",
  },
  {
    question: "How often is the data updated?",
    answer:
      "Our keyword database is updated every few days with fresh data from Google Ads. With that being said, higher volume keywords are updated more often then lower volume ones, but every keyword is updated at least a few times a year. Each keyword entry shows its last updated date so you always know how recent the data is.",
  },
  {
    question: "What happens after my 10 free searches?",
    answer:
      "After your 10 free searches, you can choose a paid plan to continue with unlimited searches. Your free searches don't expire, so you can take your time deciding.",
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
  {
    question: "How is this different from other keyword tools?",
    answer:
      "Most keyword tools charge $99+/month and bury the data behind complex dashboards, with limited filter options. KeywordsDB gives you direct access to the raw Google Search data in a fast, searchable table — at a fraction of the cost.",
  },
  {
    question: "What keywords are included in the database?",
    answer:
      "Our database covers 290M+ English-language keywords from Google Search, spanning every niche and industry. We're continuously expanding coverage to include more languages and regions.",
  },
];

const faqsPaywall = [
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

export function FAQAccordion({ isPaywall = false }: { isPaywall?: boolean }) {
  const faqsToShow = isPaywall ? faqsPaywall : faqs;

  return (
    <Accordion type="single" collapsible className="w-full">
      {faqsToShow.map((faq, i) => (
        <AccordionItem key={faq.question} value={`item-${i}`}>
          <AccordionTrigger className="text-left text-base">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed h-fit">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function FAQ() {
  return (
    <section id="faq" className="border-t bg-muted/20 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about KeywordsDB.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <FAQAccordion />
        </div>
      </div>
    </section>
  );
}

export default FAQ;
