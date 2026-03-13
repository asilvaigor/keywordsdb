import type { Metadata } from "next";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { ContactUsIcon } from "@/components/icons/contact-us";

export const metadata: Metadata = {
  title: "Contact Us | KeywordsDB",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-16 flex-1 flex items-center text-center md:text-left">
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
      </main>
      <Footer />
    </div>
  );
}
