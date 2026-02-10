"use client";

import { useEffect } from "react";
import { identify } from "@/lib/analytics/posthog";
import { KeywordsTable } from "../keywords-table";

function Dashboard({ userData }: { userData: { email: string } }) {
  useEffect(() => {
    identify(userData.email);
  }, [userData.email]);

  return <KeywordsTable />;
}

export default Dashboard;
