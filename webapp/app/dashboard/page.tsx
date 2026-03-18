import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";
import Header from "@/components/header";
import { getUserData } from "@/lib/db/users";

const title = "Dashboard | KeywordsDB";
const description =
  "Access the KeywordsDB dashboard to unlock the full potential of our free keyword research tool and take your SEO strategy to the next level.";

export const metadata: Metadata = {
  title: title,
  description: description,
  metadataBase: "https://keywordsdb.com",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: title,
    description: description,
    type: "website",
    url: "/dashboard",
    locale: "en_US",
    siteName: "keywordsdb",
    images: {
      url: "/og-image.png",
      width: 2115,
      height: 1189,
      alt: title,
    },
  },
};

export default async function DashboardPage() {
  const userData = await getUserData();
  if (userData == null) {
    redirect("/login");
  } else if (!userData.subscriptionActive && userData.freeCredits <= 0) {
    redirect("/paywall");
  }
  return (
    <div className="flex flex-col items-center h-dvh">
      <Header userData={userData} />
      <Dashboard userData={userData} />
    </div>
  );
}
