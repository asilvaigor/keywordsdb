"use client";

import { useEffect } from "react";
import { KeywordsTable } from "@/components/keywords-table";
import { identify } from "@/lib/analytics/posthog";
import type { UserData } from "@/lib/types";

function Dashboard({ userData }: { userData: UserData }) {
  useEffect(() => {
    identify(userData.email);
  }, [userData.email]);

  return (
    <div className="flex-1 w-full max-w-fit px-6">
      <KeywordsTable isSample />
    </div>
  );
}

export default Dashboard;
