import { Box } from "lucide-react";
import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Box className="h-5 w-5" />
      <span className="text-md font-semibold">KeywordsDB</span>
    </Link>
  );
}

export default Logo;
