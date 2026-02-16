import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { headers } from "next/headers";
import firestore from "@/lib/firestore";
import type { UserData } from "@/lib/types";
import { firestoreAdapter } from "./firestore-adapter";
import { html } from "./magic-link";

const FREE_CREDITS = 10;

export const auth = betterAuth({
  theme: {
    colorScheme: "dark",
    logo: "/apple-icon.png",
    brandColor: "#fcc800",
    buttonText: "#161616",
  },
  onAPIError: {
    errorURL: "/login/error",
  },
  database: firestoreAdapter({
    firestore: firestore,
    collections: {
      users: "auth-users",
      accounts: "auth-accounts",
      sessions: "auth-sessions",
      verificationTokens: "auth-verification-tokens",
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.BETTER_AUTH_GOOGLE_ID as string,
      clientSecret: process.env.BETTER_AUTH_GOOGLE_SECRET as string,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.BETTER_AUTH_RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "noreply@resend.dev",
            to: email,
            subject: "Sign in to KeywordsDB",
            html: html({ url }),
          }),
        });
      },
    }),
  ],
});

export const getUserData = async (): Promise<UserData | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.email) {
    const docRef = firestore.collection("users").doc(session.user.email);
    const doc = await docRef.get();
    const now = new Date().toISOString();
    if (doc.exists) {
      const data = doc.data() as UserData;
      return {
        email: session.user.email,
        freeCredits: data.freeCredits ?? 0,
        subscriptionActive: data.subscriptionActive ?? false,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
    }
    const userData: UserData = {
      email: session.user.email,
      freeCredits: FREE_CREDITS,
      subscriptionActive: false,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(userData);
    return userData;
  }
  return null;
};
