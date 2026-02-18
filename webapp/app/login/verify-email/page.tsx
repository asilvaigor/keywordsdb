import type { Metadata } from "next";
import { redirect } from "next/navigation";
import VerifyEmail from "@/components/auth/verify-email";
import { getUserData } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Verify Email - keywordsdb.com",
};

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
