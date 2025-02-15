import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { Box } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="absolute w-full my-4">
      <div className="container flex items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Box className="h-6 w-6" />
          <span className="ml-2 text-md font-semibold">KeywordsDB</span>
        </Link>
        <DarkModeToggle />
      </div>
    </header>
  );
};

export default Header;
