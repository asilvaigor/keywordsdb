"use client";

import { Box } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";

const Header = () => {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-transparent bg-background/80 backdrop-blur-md transition-colors">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          <span className="text-md font-semibold">KeywordsDB</span>
        </Link>

        <div className="flex items-center gap-1">
          {isLanding && (
            <nav className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <a href="#features">Features</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#pricing">Pricing</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#faq">FAQ</a>
              </Button>
              <Button size="default" className="ml-1 font-semibold" asChild>
                <Link href="/dashboard">Try Free</Link>
              </Button>
            </nav>
          )}
          {!isLanding && <DarkModeToggle />}
        </div>
      </div>
    </header>
  );
};

export default Header;
