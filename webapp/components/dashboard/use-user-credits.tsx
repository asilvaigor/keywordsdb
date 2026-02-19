"use client";

import useSWR from "swr";
import type { UserData } from "@/lib/types";

const POLL_INTERVAL_MS = 10_000;

async function getAuthorizedUserData(_: string): Promise<UserData> {
  const response = await fetch("/api/db/getUserData");
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  const data = await response.json();
  return data as UserData;
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
