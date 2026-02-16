import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";
import Header from "@/components/header";
import { getUserData } from "@/lib/auth/users";

export default async function DashboardPage() {
  const userData = await getUserData();
  if (userData == null) {
    redirect("/login");
  } else if (!userData.subscriptionActive && userData.freeCredits <= 0) {
    redirect("/paywall");
  }
  return (
    <div className="flex flex-col items-center h-screen">
      <Header userData={userData} />
      <Dashboard userData={userData} />
    </div>
  );
}
