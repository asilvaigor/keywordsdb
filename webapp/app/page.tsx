import Header from "@/components/header";
import { KeywordsTable } from "@/components/keywords-table";

export default async function Home() {
	return (
		<div className="container mx-auto h-screen">
			<Header />
      <KeywordsTable />
		</div>
	);
}
