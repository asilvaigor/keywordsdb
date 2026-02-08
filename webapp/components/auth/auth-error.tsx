"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function AuthError() {
  const search = useSearchParams();
  const error = search.get("error");
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
      <CardContent className="flex flex-col justify-between mb-8 h-64">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mt-8 text-destructive">
            <TriangleAlert size="100%" />
          </div>
          <h1 className="text-xl font-semibold">Unable to sign in</h1>
          <p className="text-muted-foreground">
            {error === "Verification"
              ? "The link is no longer valid. It may have been used already or it may have expired."
              : "Please contact us if this error persists."}
          </p>
        </div>
        <Button variant="outline" size="lg" className="h-11" asChild>
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default AuthError;
