import { redirect } from "next/navigation";
import VerifyEmail from "@/components/auth/verify-email";
import { getUserData } from "@/lib/db/users";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Verify Email - keywordsdb.com",
  description:
    "Verify your email to access KeywordsDB and explore 300M+ keywords for data-driven research.",
  canonicalUrl: "/login/verify-email",
});

async function VerifyEmailPage() {
  const userData = await getUserData();
  if (userData != null) {
    if (!userData.subscriptionActive && userData.freeCredits <= 0) {
      redirect("/paywall");
    } else {
      redirect("/dashboard");
    }
  }
  return (
    <main className="flex items-center justify-center h-screen">
      <VerifyEmail />
    </main>
  );
}

export default VerifyEmailPage;
