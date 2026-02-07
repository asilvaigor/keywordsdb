import Header from "@/components/header";
import { KeywordsTable } from "@/components/keywords-table";

export default async function AppPage() {
  return (
    <div className="flex flex-col mx-auto h-screen">
      <Header />
      <KeywordsTable />
    </div>
  );
}
