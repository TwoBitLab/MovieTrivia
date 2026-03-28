import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Seeding is done via CLI scripts (scripts/seed-tmdb.ts etc.)
  // This endpoint exists as a future hook for scheduled re-seeding.
  return Response.json({ message: "Use CLI scripts to seed: npm run seed:tmdb" });
}
