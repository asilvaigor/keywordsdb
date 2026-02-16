import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";
import Header from "@/components/header";
import { getUserData } from "@/lib/auth/server";

export default async function AppPage() {
  const userData = await getUserData();
  if (!userData?.email) {
    redirect("/login");
  }
  return (
    <div className="flex flex-col items-center h-screen">
      <Header userData={userData} />
      <Dashboard userData={userData} />
    </div>
  );
}
