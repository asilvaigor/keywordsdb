"use client";

import {
  CreditCard,
  HelpCircle,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useUserCredits } from "@/components/dashboard/use-user-credits";
import Logo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/client";
import { billingPortal } from "@/lib/stripe/billing-portal";
import type { UserData } from "@/lib/types";

// const ALL_COLUMNS = [
//   { key: "keyword", label: "Keyword" },
//   { key: "volume_estimated_google", label: "Volume" },
//   { key: "competition_index", label: "Competition" },
//   { key: "cpc_high", label: "CPC" },
//   { key: "volume_history_google", label: "Volume History" },
//   { key: "updated_at", label: "Last Updated" },
// ] as const;

function DashboardHeader({ userData }: { userData: UserData }) {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [isBillingPending, startBillingTransition] = useTransition();
  const { freeCredits } = useUserCredits({
    initialCredits: userData.freeCredits,
    subscriptionActive: userData.subscriptionActive,
  });

  useEffect(() => {
    if (!userData.subscriptionActive && freeCredits <= 0) {
      router.push("/paywall");
    }
  }, [userData.subscriptionActive, freeCredits, router]);

  return (
    <div className="flex items-center gap-2">
      {/* Subscription / Credits indicator */}
      {userData.subscriptionActive ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 pointer-events-none hidden sm:inline-flex"
          asChild
        >
          <span>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {userData.subscriptionType === "pro"
              ? "Pro subscription"
              : "Max subscription"}
          </span>
        </Button>
      ) : (
        <Badge
          variant="secondary"
          className="gap-1.5 text-xs font-medium hidden sm:inline-flex"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          {freeCredits} free credit
          {freeCredits !== 1 ? "s" : ""} left
        </Badge>
      )}

      {/* Menu dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{userData.email}</DropdownMenuLabel>

          {/* Mobile-only credits/subscription line */}
          <div className="sm:hidden px-1.5 pb-1">
            {userData.subscriptionActive ? (
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Sparkles className="h-3 w-3 text-primary" />
                {userData.subscriptionType === "pro"
                  ? "Pro subscription"
                  : "Max subscription"}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {freeCredits} free credit
                {freeCredits !== 1 ? "s" : ""} remaining
              </span>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Table Columns sub-menu */}
          {/* <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <Columns3 className="h-4 w-4" />
                Table Columns
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                {ALL_COLUMNS.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={true}
                    disabled={col.key === "keyword"}
                    onCheckedChange={() => {
                      // Column visibility will be wired to table state
                    }}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator /> */}

          {/* Theme toggle */}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTheme(theme === "dark" ? "light" : "dark");
            }}
            className="cursor-pointer"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </DropdownMenuItem>

          {/* Contact / Support */}
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/contact">
              <HelpCircle className="h-4 w-4" />
              Support
            </Link>
          </DropdownMenuItem>

          {/* Billing */}
          {userData.subscriptionActive && (
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={isBillingPending}
              onSelect={(e) => {
                e.preventDefault();
                startBillingTransition(async () => {
                  const result = await billingPortal({ email: userData.email });
                  if (result?.error) {
                    toast.error(result.error);
                  }
                });
              }}
            >
              {isBillingPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Billing
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Sign out */}
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => signOut()}
            className="cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const Header = ({ userData }: { userData?: UserData }) => {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto">
        <Logo />

        {isLanding && (
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" asChild>
              <a href="#features">Features</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="#pricing">Pricing</a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="#faq">FAQ</a>
            </Button>
          </nav>
        )}

        {isLanding && (
          <nav className="flex items-center gap-1 justify-end">
            <Button variant="ghost" className="hidden md:flex" asChild>
              <a href="/login">Login</a>
            </Button>
            <Button className="ml-1 font-semibold" asChild>
              <Link href="/login">Try Free</Link>
            </Button>
          </nav>
        )}

        {isDashboard && userData && <DashboardHeader userData={userData} />}
      </div>
    </header>
  );
};

export default Header;
