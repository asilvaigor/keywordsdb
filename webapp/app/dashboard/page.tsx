import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";
import Header from "@/components/header";
import { getUserData } from "@/lib/db/users";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Dashboard | KeywordsDB",
  description:
    "Access the KeywordsDB dashboard to unlock the full potential of our free keyword research tool and take your SEO strategy to the next level.",
  canonicalUrl: "/dashboard",
});

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
