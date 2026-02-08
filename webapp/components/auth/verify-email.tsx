import Link from "next/link";
import Logo from "@/components/logo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function VerifyEmail() {
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
        <div className="flex flex-col items-center justify-center text-center gap-5 h-full">
          <h2 className="text-2xl font-semibold">Please check your email</h2>
          <p className="text-muted-foreground">
            A sign in link has been sent to your email address. You may now
            close this page.
          </p>
        </div>

        <div className="text-center text-xs text-muted-foreground/50 mt-8">
          By continuing you are agreeing to our{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-yellow-500 transition-colors"
          >
            Privacy Policy
          </Link>{" "}
          and our{" "}
          <Link
            href="/tos"
            className="underline underline-offset-4 hover:text-yellow-500 transition-colors"
          >
            Terms and Conditions
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default VerifyEmail;
