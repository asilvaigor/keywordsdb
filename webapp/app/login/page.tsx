import { redirect } from "next/navigation";
import Login from "@/components/auth/login";
import { getUserData } from "@/lib/db/users";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Log In to KeywordsDB - Free Keyword Research",
  description:
    "Access the KeywordsDB dashboard to unlock the full potential of our free keyword research tool and take your SEO strategy to the next level.",
  canonicalUrl: "/login",
});

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
