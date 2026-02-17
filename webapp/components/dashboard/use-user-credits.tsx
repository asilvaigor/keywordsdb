"use client";

import useSWR from "swr";
import { getUserData } from "@/lib/db/users";
import type { UserData } from "@/lib/types";

const POLL_INTERVAL_MS = 10_000;

async function getAuthorizedUserData(_: string): Promise<UserData> {
  const data = await getUserData();
  if (!data) {
    throw new Error("Unauthorized");
  }
  return data;
}

export function useUserCredits({
  initialCredits,
  subscriptionActive,
}: {
  initialCredits: number;
  subscriptionActive: boolean;
}) {
  const { data } = useSWR<UserData>(
    subscriptionActive ? null : "credits",
    getAuthorizedUserData,
    { refreshInterval: POLL_INTERVAL_MS },
  );

  return {
    freeCredits: data?.freeCredits ?? initialCredits,
  };
}
