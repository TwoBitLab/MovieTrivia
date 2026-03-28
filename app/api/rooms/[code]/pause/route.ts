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
    .select("id, host_id, status")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
  if (room.host_id !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const newStatus = room.status === "paused" ? "active" : "paused";
  await service.from("rooms").update({ status: newStatus }).eq("id", room.id);

  const event = newStatus === "paused" ? "game_paused" : "game_resumed";
  await service.channel(`room:${code.toUpperCase()}`).send({
    type: "broadcast",
    event,
    payload: {},
  });

  return Response.json({ status: newStatus });
}
