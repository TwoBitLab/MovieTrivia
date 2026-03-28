import type { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  const { data: room } = await service
    .from("rooms")
    .select("id, status")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
  if (room.status === "finished") {
    return Response.json({ error: "Game has ended" }, { status: 410 });
  }

  // Upsert: no-op if already in room
  await service.from("room_players").upsert(
    { room_id: room.id, player_id: user.id, is_host: false },
    { onConflict: "room_id,player_id", ignoreDuplicates: true }
  );

  return Response.json({ ok: true });
}
