import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { redirect } from "next/navigation";

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export async function signInWithGoogle() {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });
}

export async function signInWithMagicLink(email: string) {
  await authClient.signIn.magicLink({
    email: email,
    callbackURL: "/dashboard",
  });
}

export async function signOut() {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        redirect("/");
      },
    },
  });
}
