import type { Metadata } from "next";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { ContactUsIcon } from "@/components/icons/contact-us";

const title = "Contact KeywordsDB - Get in Touch With Our Team";
const description =
  "Whether you have a question about your keyword data, a feature request, or just want to say hello, we're here to help. We reply to every message personally.";

export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: "/contact",
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

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl mx-auto px-4 py-16 flex items-center text-center md:text-left">
          <div className="grid md:grid-cols-2 gap-12 items-center w-full">
            {/* Illustration */}
            <div className="flex justify-center">
              <ContactUsIcon />
            </div>

            {/* Content */}
            <div>
              <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
                Get in touch
              </p>
              <h1 className="mb-6 text-4xl font-bold leading-tight">
                We&apos;d love to
                <br />
                hear from you
              </h1>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                Have a question about your keyword data, a feature request, or
                just want to say hello? We read every message and reply
                personally.
              </p>
              <a
                href="mailto:support@keywordsdb.com"
                className="inline-flex items-center gap-3 rounded-xl border border-border bg-muted px-5 py-4 text-sm font-semibold hover:bg-accent transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="1"
                    y="3.5"
                    width="16"
                    height="11"
                    rx="2"
                    className="stroke-primary"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M1 6l8 5 8-5"
                    className="stroke-primary"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                support@keywordsdb.com
              </a>
              <p className="mt-4 text-xs text-muted-foreground">
                We aim to respond within 24-48 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Below-fold content */}
        <section className="border-t bg-muted/20 py-16">
          <div className="container max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-4">How can we help?</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Whether you&apos;re a first-time user or a long-time subscriber,
              we&apos;re happy to assist with anything related to KeywordsDB.
              Our team handles every inquiry personally — no bots, no
              auto-replies.
            </p>

            <h2 className="text-2xl font-bold mb-4">Common topics</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Here are some of the things people most commonly reach out to us
              about:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
              <li>
                <strong className="text-foreground">
                  Keyword data questions
                </strong>{" "}
                — If you&apos;re seeing unexpected search volumes, missing
                keywords, or data that doesn&apos;t match other tools,
                we&apos;re happy to explain how our data is sourced and updated.
              </li>
              <li>
                <strong className="text-foreground">
                  Account &amp; billing
                </strong>{" "}
                — Questions about your subscription, invoices, or cancellations.
                We process all changes quickly and never hold you to a contract.
              </li>
              <li>
                <strong className="text-foreground">Feature requests</strong> —
                Got an idea for a new filter, export format, or tool? We
                actively prioritize features based on user feedback, so your
                input genuinely shapes the product.
              </li>
              <li>
                <strong className="text-foreground">Bug reports</strong> — If
                something isn&apos;t working as expected, let us know and
                we&apos;ll investigate right away.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              You can also find answers to common questions in our{" "}
              <a href="/blog" className="text-primary hover:underline">
                blog
              </a>
              , where we publish keyword research tips, SEO guides, and product
              updates regularly.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
