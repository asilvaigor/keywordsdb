import type { Metadata } from "next";
import Footer from "@/components/footer";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Contact Us | KeywordsDB",
};

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container max-w-3xl text-justify mx-auto px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">Contact Us</h1>
        <p className="mb-4">
          If you have any questions, suggestions, or feedback regarding
          KeywordsDB, please feel free to reach out to us. We value your input
          and are here to assist you.
        </p>
        <p className="mb-4">
          You can contact us via email at{" "}
          <a
            className="font-bold underline underline-offset-4"
            href="mailto:support@keywordsdb.com"
          >
            support@keywordsdb.com
          </a>
          . We aim to respond to all inquiries within 24-48 hours.
        </p>
      </main>
      <Footer />
    </div>
  );
}
