"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  CreditCard,
  Globe,
  Hash,
  HelpCircle,
  Lightbulb,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Newspaper,
  Sparkles,
  Sun,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useUserCredits } from "@/components/dashboard/use-user-credits";
import Logo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOut } from "@/lib/auth/client";
import { billingPortal } from "@/lib/stripe/billing-portal";
import type { UserData } from "@/lib/types";
import { cn } from "@/lib/utils";

function DashboardMenuItems({
  userData,
  freeCredits,
  theme,
  setTheme,
  isBillingPending,
  startBillingTransition,
  showCredits = false,
  variant = "popup",
}: {
  userData: UserData;
  freeCredits: number;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  isBillingPending: boolean;
  startBillingTransition: (fn: () => Promise<void>) => void;
  showCredits?: boolean;
  variant?: "popup" | "drawer";
}) {
  const isDrawer = variant === "drawer";
  return (
    <div className={isDrawer ? "flex flex-col p-4 h-full" : "flex flex-col"}>
      <div
        className={cn(
          "text-muted-foreground",
          isDrawer ? "text-base pb-3" : "text-xs pb-1",
        )}
      >
        {userData.email}
      </div>

      {showCredits && (
        <div className={isDrawer ? "mb-4" : "mb-1"}>
          {userData.subscriptionActive ? (
            <Badge
              variant="secondary"
              className={
                isDrawer ? "gap-2 text-sm py-1 px-3" : "gap-1.5 text-xs"
              }
            >
              <Sparkles
                className={
                  isDrawer ? "h-4 w-4 text-primary" : "h-3 w-3 text-primary"
                }
              />
              {userData.subscriptionType === "pro"
                ? "Pro subscription"
                : "Max subscription"}
            </Badge>
          ) : (
            <span
              className={
                isDrawer
                  ? "text-sm text-muted-foreground"
                  : "text-xs text-muted-foreground"
              }
            >
              {freeCredits} free credit{freeCredits !== 1 ? "s" : ""} remaining
            </span>
          )}
        </div>
      )}

      <div
        className={cn("h-px bg-border", isDrawer ? "-mx-4 my-2" : "-mx-2 my-1")}
      />

      {/* Theme toggle */}
      <button
        type="button"
        // biome-ignore lint/a11y/noAutofocus: moves focus inside drawer to fix aria-hidden conflict on trigger
        autoFocus={isDrawer}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={cn(
          "flex items-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer",
          isDrawer ? "gap-4 py-3 text-base" : "gap-2 p-1.5 text-sm",
        )}
      >
        {theme === "light" ? (
          <Moon
            className={cn(
              "text-muted-foreground",
              isDrawer ? "h-5 w-5" : "h-4 w-4",
            )}
          />
        ) : (
          <Sun
            className={cn(
              "text-muted-foreground",
              isDrawer ? "h-5 w-5" : "h-4 w-4",
            )}
          />
        )}
        {theme === "light" ? "Dark mode" : "Light mode"}
      </button>

      {/* Contact / Support */}
      <Link
        href="/contact"
        className={cn(
          "flex items-center rounded-md hover:bg-accent",
          isDrawer ? "gap-4 py-3 text-base" : "gap-2 p-1.5 text-sm",
        )}
      >
        <HelpCircle
          className={cn(
            "text-muted-foreground",
            isDrawer ? "h-5 w-5" : "h-4 w-4",
          )}
        />
        Support
      </Link>

      {/* Billing */}
      {userData.subscriptionActive && (
        <button
          type="button"
          disabled={isBillingPending}
          onClick={() =>
            startBillingTransition(async () => {
              const result = await billingPortal({ email: userData.email });
              if (result?.error) {
                toast.error(result.error);
              }
            })
          }
          className={cn(
            "flex items-center rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
            isDrawer ? "gap-4 py-3 text-base" : "gap-2 p-1.5 text-sm",
          )}
        >
          {isBillingPending ? (
            <Loader2
              className={cn("animate-spin", isDrawer ? "h-5 w-5" : "h-4 w-4")}
            />
          ) : (
            <CreditCard
              className={cn(
                "text-muted-foreground",
                isDrawer ? "h-5 w-5" : "h-4 w-4",
              )}
            />
          )}
          Manage subscription
        </button>
      )}

      <div
        className={cn(
          "bg-border h-px",
          isDrawer ? "-mx-4 my-2 mb-5" : "-mx-2 my-1",
        )}
      />

      {/* Sign out */}
      <button
        type="button"
        onClick={() => signOut()}
        className={cn(
          "flex items-center rounded-md hover:bg-destructive/10 text-destructive cursor-pointer",
          isDrawer ? "gap-4 text-base" : "gap-2 p-1.5 text-sm",
        )}
      >
        <LogOut className={isDrawer ? "h-5 w-5" : "h-4 w-4"} />
        Sign Out
      </button>
    </div>
  );
}

function DashboardHeader({ userData }: { userData: UserData }) {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [isBillingPending, startBillingTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { freeCredits } = useUserCredits({
    initialCredits: userData.freeCredits,
    subscriptionActive: userData.subscriptionActive,
  });

  useEffect(() => {
    if (!userData.subscriptionActive && freeCredits <= 0) {
      router.push("/paywall");
    }
  }, [userData.subscriptionActive, freeCredits, router]);

  const menuProps = {
    userData,
    freeCredits,
    theme,
    setTheme,
    isBillingPending,
    startBillingTransition,
  };

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

      {/* Mobile: drawer */}
      <div className="sm:hidden">
        <Drawer
          direction="right"
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        >
          <DrawerTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent aria-describedby={undefined}>
            <VisuallyHidden>
              <DrawerTitle>Navigation menu</DrawerTitle>
            </VisuallyHidden>
            <DashboardMenuItems {...menuProps} showCredits variant="drawer" />
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: Popover */}
      <div className="hidden sm:block">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-54">
            <DashboardMenuItems {...menuProps} />
          </PopoverContent>
        </Popover>
      </div>
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

const drawerLinkIcons: Record<string, React.ReactNode> = {
  "/blog": <Newspaper className="h-4 w-4 text-muted-foreground" />,
  "#pricing": <Tag className="h-4 w-4 text-muted-foreground" />,
  "#faq": <MessageCircle className="h-4 w-4 text-muted-foreground" />,
  "/solutions/saas-ideas": (
    <Lightbulb className="h-4 w-4 text-muted-foreground" />
  ),
  "/seo-audit": <Globe className="h-4 w-4 text-muted-foreground" />,
  "/density-checker": <Hash className="h-4 w-4 text-muted-foreground" />,
};

function LandingMobileMenu() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent
          className="flex flex-col px-4 py-4"
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <DrawerTitle>Navigation menu</DrawerTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-between">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              autoFocus
              onClick={() => setDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <div className="h-px bg-border -mx-4 my-4" />

          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground pb-1">
            Product
          </div>
          {[
            { href: "/blog", label: "Blog" },
            { href: "#pricing", label: "Pricing" },
            { href: "#faq", label: "FAQ" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md py-2 text-base hover:bg-accent"
              onClick={() => setDrawerOpen(false)}
            >
              {drawerLinkIcons[href]}
              {label}
            </Link>
          ))}

          {solutionGroups.map((group) => (
            <div key={group.title}>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-4 pb-1">
                {group.title}
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md py-2 hover:bg-accent"
                  onClick={() => setDrawerOpen(false)}
                >
                  {drawerLinkIcons[item.href]}
                  <span className="text-base">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}

          <div className="h-px bg-border -mx-4 my-4" />

          <div className="flex flex-col gap-3 my-3">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button className="font-semibold" asChild>
              <Link href="/login" onClick={() => setDrawerOpen(false)}>
                Try Free
              </Link>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

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
            <Link href="#pricing">Pricing</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="#faq">FAQ</Link>
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
      <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-6xl">
        <Logo />

        {isLanding && <LandingNavigation />}

        {isLanding && (
          <>
            <nav className="hidden md:flex items-center gap-1 justify-end">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button className="ml-1 font-semibold" asChild>
                <Link href="/login">Try Free</Link>
              </Button>
            </nav>
            <LandingMobileMenu />
          </>
        )}

        {isDashboard && userData && <DashboardHeader userData={userData} />}
      </div>
    </header>
  );
};

export default Header;
