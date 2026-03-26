import type { Metadata } from "next";
import Footer from "@/components/footer";
import Header from "@/components/header";
import SeoAudit from "@/components/seo-audit";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const title = "Free SEO Audit Tool | KeywordsDB";
const description =
  "Run a free SEO audit on any website. Checks meta tags, content quality, internal links, performance, and more. Get a score with actionable recommendations.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/seo-audit" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/seo-audit",
    locale: "en_US",
    siteName: "KeywordsDB",
    images: {
      url: "/og-image.png",
      width: 2115,
      height: 1189,
      alt: title,
    },
  },
};

const faqs = [
  {
    question: "What does this SEO audit check?",
    answer:
      "The audit runs 20+ checks across five categories: Meta Tags (title, description, Open Graph, canonical URL, etc.), Content (word count, heading structure, image alt text, text-to-HTML ratio), Technical (HTTPS, robots.txt, sitemap.xml, structured data, doctype), Links (broken links, internal linking, orphan pages), and Performance (server response time, page size). Each check gives a pass or fail result.",
  },
  {
    question: "How many pages does it crawl?",
    answer:
      "The tool crawls up to 1000 pages on your website, starting from the URL you enter and following internal links. It also checks your robots.txt and sitemap.xml files separately. This gives a solid picture of your site's overall SEO health without taking too long.",
  },
  {
    question: "How is the SEO score calculated?",
    answer:
      "Each check receives a pass or fail score. These are averaged within each category, then combined using weighted averages. The final score ranges from 0 to 100.",
  },
  {
    question: "Is the SEO audit free?",
    answer:
      "Yes, the SEO audit tool is completely free to use with no limits. No account or sign-up required. Just enter a URL and get your results.",
  },
  {
    question: "How long does the audit take?",
    answer:
      "Typically 15-45 seconds, depending on how many pages your site has and how fast your server responds. You'll see real-time progress as each page is crawled.",
  },
];

export default function SeoAuditPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <SeoAudit />

        {/* Below-fold educational content */}
        <section className="border-t bg-muted/20 py-16 md:py-24">
          <div className="container max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-4">What is an SEO audit?</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                An SEO audit is a comprehensive analysis of a website&apos;s
                search engine optimization. It evaluates{" "}
                <strong className="text-foreground">technical setup</strong>,{" "}
                <strong className="text-foreground">on-page elements</strong>,
                and <strong className="text-foreground">content quality</strong>{" "}
                to identify issues that may be preventing the site from ranking
                well in search results.
              </p>
              <p>
                This free tool crawls your website the same way search engines
                do — following links, reading meta tags, and checking for common
                technical issues. It then scores each area and gives you
                actionable recommendations to improve your SEO.
              </p>
              <p>
                Regular SEO audits help you catch problems early — like broken
                links, missing meta descriptions, or slow page loads — before
                they hurt your rankings. We recommend running an audit after any
                major site changes or at least once a month.
              </p>
            </div>

            {/* FAQ section */}
            <h2 className="text-2xl font-bold mt-12 mb-6" id="faq">
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`faq-${i}`}>
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
