import { getUserData } from "@/lib/db/users";

export async function GET() {
  const userData = await getUserData();
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }
  return new Response(JSON.stringify(userData), {
    headers: { "Content-Type": "application/json" },
  });
}
