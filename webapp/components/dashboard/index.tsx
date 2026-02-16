"use client";

import { useEffect } from "react";
import { identify } from "@/lib/analytics/posthog";
import type { UserData } from "@/lib/types";
import { KeywordsTable } from "../keywords-table";

function Dashboard({ userData }: { userData: UserData }) {
  useEffect(() => {
    identify(userData.email);
  }, [userData.email]);

  return (
    <div className="flex-1 w-full max-w-fit px-6">
      <KeywordsTable />
    </div>
  );
}

export default Dashboard;
