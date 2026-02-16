import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Paywall from "@/components/paywall";
import { getUserData } from "@/lib/auth/users";

export const metadata: Metadata = {
  title: "Activate your subscription now to keep using KeywordsDB",
};

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
      <Paywall />
      <Footer />
    </main>
  );
}

export default PaywallPage;
