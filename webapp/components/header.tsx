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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { signOut } from "@/lib/auth/client";
import { billingPortal } from "@/lib/stripe/billing-portal";
import type { UserData } from "@/lib/types";

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
              Manage subscription
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

const solutionGroups = [
  {
    title: "Use cases",
    items: [
      {
        href: "/solutions/saas-ideas",
        label: "SaaS Ideas",
        description: "Find software opportunities with real search demand.",
      },
    ],
  },
  {
    title: "Free tools",
    items: [
      {
        href: "/seo-audit",
        label: "SEO Audit",
        description: "Run a technical and on-page audit on any website.",
      },
      {
        href: "/density-checker",
        label: "Density Checker",
        description: "Analyze keyword density and phrase frequency on a page.",
      },
    ],
  },
] as const;

function LandingNavigation() {
  return (
    <NavigationMenu viewport={false} className="hidden md:flex">
      <NavigationMenuList className="gap-1.5">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-2 w-sm">
              {solutionGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </div>
                  {group.items.map((item) => (
                    <NavigationMenuLink asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="flex flex-col items-start rounded-md px-3 pt-3 pb-2 text-sm leading-none no-underline outline-hidden transition-colors hover:bg-muted focus:bg-muted"
                      >
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </div>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/blog">Blog</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <a href="#pricing">Pricing</a>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <a href="#faq">FAQ</a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const Header = ({ userData }: { userData?: UserData }) => {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname.startsWith("/solutions/");
  const isDashboard = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto">
        <Logo />

        {isLanding && <LandingNavigation />}

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
