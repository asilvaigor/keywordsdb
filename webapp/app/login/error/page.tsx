import type { Metadata } from "next";
import { Suspense } from "react";
import AuthError from "@/components/auth/auth-error";

export const metadata: Metadata = {
  title: "Login error - keywordsdb.com",
};

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
