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
    <div className="flex flex-col mx-auto h-screen">
      <Header />
      <Dashboard userData={userData} />
    </div>
  );
}
