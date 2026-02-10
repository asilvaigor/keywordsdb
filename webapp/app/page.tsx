import Footer from "@/components/footer";
import Header from "@/components/header";
import FAQ from "@/components/landing/faq";
import Features from "@/components/landing/features";
import FinalCTA from "@/components/landing/final-cta";
import Hero from "@/components/landing/hero";
import Pricing from "@/components/landing/pricing";
import Stats from "@/components/landing/stats";
import Video from "@/components/landing/video";

function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
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
