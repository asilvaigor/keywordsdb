import { Suspense } from "react";
import AuthError from "@/components/auth/auth-error";
import { getMetadata } from "@/lib/metadata";

export const metadata = getMetadata({
  title: "Login error - keywordsdb.com",
  description:
    "An error occurred during login. Please try again or contact support if the issue persists.",
  canonicalUrl: "/login/error",
});

function LoginError() {
  return (
    <main className="flex items-center justify-center h-screen">
      <Suspense>
        <AuthError />
      </Suspense>
    </main>
  );
}

export default LoginError;
