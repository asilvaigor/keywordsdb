import Footer from "@/components/footer";
import Header from "@/components/header";
import Benefits from "@/components/landing/benefits";
import FAQ, { faqs } from "@/components/landing/faq";
import FinalCTA from "@/components/landing/final-cta";
import Hero from "@/components/landing/hero";
import Pricing from "@/components/landing/pricing";
import Stats from "@/components/landing/stats";
import Video from "@/components/landing/video";
import { faqPageJsonLd, websiteJsonLd } from "@/lib/json-ld";

function Home() {
  const faqItems = faqs.map((f) => ({
    question: f.question,
    answer: typeof f.answer === "string" ? f.answer : (f.textAnswer ?? ""),
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <script type="application/ld+json">
        {JSON.stringify(websiteJsonLd())}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqPageJsonLd(faqItems))}
      </script>
      <Header />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Benefits />
        <Video />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
