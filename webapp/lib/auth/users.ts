"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import firestore from "@/lib/firestore";
import type { UserData } from "@/lib/types";

export async function getUserData(): Promise<UserData | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.email) {
    const docRef = firestore.collection("users").doc(session.user.email);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      if (!data) {
        throw new Error("User data is undefined");
      }
      return {
        email: session.user.email,
        freeCredits: data.freeCredits,
        lastFreeCreditUsedAt: data.lastFreeCreditUsedAt?.toDate() ?? null,
        subscriptionActive: data.subscriptionActive,
      };
    }
    const userData: UserData = {
      email: session.user.email,
      freeCredits: 10,
      lastFreeCreditUsedAt: null,
      subscriptionActive: false,
    };
    await docRef.set(userData);
    return userData;
  }
  return null;
}

export async function decreaseFreeCredits(user: UserData) {
  const now = new Date();
  if (
    user.lastFreeCreditUsedAt &&
    now.getTime() - user.lastFreeCreditUsedAt.getTime() < 30 * 1000
  ) {
    // Prevent decreasing credits if the last free credit was used less than 30 seconds ago
    return;
  }
  const docRef = firestore.collection("users").doc(user.email);
  await docRef.update({
    freeCredits: user.freeCredits - 1,
    lastFreeCreditUsedAt: now,
  });
}
