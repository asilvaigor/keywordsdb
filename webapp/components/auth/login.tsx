"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VerifyEmail from "@/components/auth/verify-email";
import { Google } from "@/components/icons/google";
import useClickhouseReady from "@/components/keywords-table/use-clickhouse-ready";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { signInWithGoogle, signInWithMagicLink } from "@/lib/auth/client";

function Login() {
  const [email, setEmail] = useState<string | undefined>(undefined);
  useClickhouseReady(true); // Start clickhouse cold start

  useEffect(() => {
    if (email) {
      signInWithMagicLink(email);
    }
  }, [email]);

  if (email) {
    return <VerifyEmail />;
  }

  return (
    <Card className="mx-auto w-full max-w-xs sm:max-w-sm">
      <CardHeader className="flex flex-col items-center gap-2 pb-6 pt-8">
        <Logo />
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold tracking-wide">Welcome</h1>
          <p className="text-sm text-muted-foreground/70">
            Access the full database
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col mb-8 text-center h-64">
        <form
          className="w-full"
          action={() => {
            signInWithGoogle();
          }}
        >
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
            type="submit"
          >
            <Google className="w-5 h-5" />
            Continue with Google
          </Button>
        </form>

        <div className="relative my-6">
          <Separator className="bg-linear-to-r from-transparent via-primary/50 to-transparent" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground/60">
            OR
          </span>
        </div>

        <form
          className="flex flex-col w-full gap-3"
          action={(formData) => {
            setEmail(formData.get("email")?.toString());
          }}
        >
          <div className="space-y-2">
            <Input
              id="email-input"
              name="email"
              type="email"
              required={true}
              placeholder="Enter your email"
              className="h-11"
            />
          </div>
          <Button type="submit" variant="outline" className="h-11">
            Continue with Email
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground/50 mt-8">
          By continuing you are agreeing to our{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>{" "}
          and our{" "}
          <Link
            href="/tos"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms and Conditions
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default Login;
