import { magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { redirect } from "next/navigation";

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export const signInWithGoogle = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });
};

export const signInWithMagicLink = async (email: string) => {
  await authClient.signIn.magicLink({
    email: email,
    callbackURL: "/dashboard",
  });
};

export const signOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        redirect("/");
      },
    },
  });
};
