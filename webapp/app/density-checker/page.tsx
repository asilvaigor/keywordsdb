import Link from "next/link";
import DensityChecker from "@/components/density-checker";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { BreadcrumbJsonLD, FAQJsonLD } from "@/components/json-ld";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Keyword Density Checker | KeywordsDB",
  description:
    "Free keyword density checker tool. Analyze any webpage to see word frequency, keyword density percentages and the most used phrases.",
  canonicalUrl: "/density-checker",
});

const faqs = [
  {
    question: "What is keyword density?",
    answer:
      "Keyword density is the percentage of times a word or phrase appears on a webpage relative to the total number of words. For example, if a 500-word page mentions a keyword 10 times, its density is 2%. It's a basic but useful metric for understanding how focused your content is on specific topics.",
  },
  {
    question: "What is a good keyword density?",
    answer:
      "There's no magic number, but most SEO experts suggest keeping primary keyword density between 1-3%. Going much higher can feel unnatural and may be flagged as keyword stuffing by search engines. Focus on writing naturally — if the density looks reasonable, you're probably fine.",
  },
  {
    question: "Does this tool count stop words?",
    answer:
      'No. Common words like "the", "is", "and", "of", etc. are automatically excluded from the results so you can focus on the meaningful keywords. Only phrases appearing at least twice are shown.',
  },
  {
    question: "What are n-grams (1-word, 2-word, 3-word)?",
    answer:
      'N-grams refer to sequences of consecutive words. A 1-word (unigram) is a single keyword, a 2-word (bigram) is a two-word phrase like "keyword research", and a 3-word (trigram) is a three-word phrase like "search engine optimization". Analyzing all three helps you understand both individual keyword usage and common phrases on a page.',
  },
  {
    question: "Is this tool free?",
    answer:
      "Yes, the keyword density checker is completely free to use with no limits. No account or sign-up required.",
  },
  {
    question: "Can I check any URL?",
    answer:
      "You can check any publicly accessible webpage. Private pages, pages behind logins, or pages that block automated requests may not work. The tool fetches the page server-side, so there are no browser-related restrictions.",
  },
];

export default function DensityCheckerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <FAQJsonLD items={faqs} />
      <BreadcrumbJsonLD
        items={[
          { name: "Home", url: "https://keywordsdb.com" },
          {
            name: "Keyword Density Checker",
            url: "https://keywordsdb.com/density-checker",
          },
        ]}
      />
      <Header />
      <main className="flex-1">
        <DensityChecker />

        {/* Below-fold content */}
        <section className="border-t bg-muted/20 py-16 md:py-24">
          <div className="container max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-4">
              What is a keyword density checker?
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                A keyword density checker analyzes a webpage and counts how
                often each word and phrase appears. It calculates the{" "}
                <strong className="text-foreground">density percentage</strong>{" "}
                — the ratio of each keyword&apos;s frequency to the total word
                count — giving you a clear picture of what topics the page
                focuses on.
              </p>
              <p>
                This is especially useful for{" "}
                <strong className="text-foreground">on-page SEO audits</strong>.
                You can quickly spot over-optimized keywords (keyword stuffing),
                identify content gaps, or verify that your target keywords
                appear with the right frequency. The tool also breaks down
                results by single words, 2-word phrases, and 3-word phrases so
                you can analyze both individual terms and common expressions.
              </p>
              <p>
                Keyword density is just one signal in a broader SEO strategy.
                Search engines like Google look at hundreds of factors when
                ranking pages, but ensuring your target keywords appear
                naturally and at a reasonable frequency is still a valuable
                on-page practice. A density that&apos;s too low may indicate the
                page isn&apos;t focused enough on the topic, while a density
                that&apos;s too high can look unnatural and may lead to keyword
                stuffing penalties.
              </p>
              <p>
                Want to learn more about how keyword density fits into your SEO
                strategy?{" "}
                <Link
                  href="/blog/what-is-keyword-density"
                  className="text-primary hover:underline"
                >
                  Read our guide on keyword density
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
