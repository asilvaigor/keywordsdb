"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";

const Header = () => {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-transparent bg-background/80 backdrop-blur-md transition-colors">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto">
        <Logo />

        <div className="flex items-center gap-1">
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
              <Button className="ml-1 font-semibold" asChild>
                <Link href="/login">Try Free</Link>
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
