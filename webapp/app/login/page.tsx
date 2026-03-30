import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Login from "@/components/auth/login";
import { getUserData } from "@/lib/db/users";

const title = "Log In to KeywordsDB - Free Keyword Research";
const description =
  "Access the KeywordsDB dashboard to unlock the full potential of our free keyword research tool and take your SEO strategy to the next level.";

export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/login" },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: "/login",
    locale: "en_US",
    siteName: "KeywordsDB",
    images: {
      url: "/og-image.png",
      width: 2115,
      height: 1189,
      alt: title,
    },
  },
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
