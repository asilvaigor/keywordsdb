import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Login from "@/components/auth/login";
import { getUserData } from "@/lib/auth/users";

export const metadata: Metadata = {
  title: "Login - keywordsdb.com",
};

async function LoginPage() {
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
      <Login />
    </main>
  );
}

export default LoginPage;
