import { redirect } from "next/navigation";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Paywall from "@/components/paywall";
import { getUserData } from "@/lib/db/users";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Activate your subscription now to keep using KeywordsDB",
  description:
    "Your free credits have expired. Activate your subscription now to keep using KeywordsDB and access 300M+ keywords with real Google search demand.",
  canonicalUrl: "/paywall",
});

async function PaywallPage() {
  const userData = await getUserData();
  if (userData == null) {
    redirect("/login");
  } else if (userData.subscriptionActive || userData.freeCredits > 0) {
    redirect("/dashboard");
  }
  return (
    <main>
      <Header />
      <Paywall email={userData.email} />
      <Footer />
    </main>
  );
}

export default PaywallPage;
