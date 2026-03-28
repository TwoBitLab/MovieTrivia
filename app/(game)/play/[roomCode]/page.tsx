import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GameClient from "@/components/game/GameClient";

interface Props {
  params: Promise<{ roomCode: string }>;
}

export default async function PlayPage({ params }: Props) {
  const { roomCode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, host_id, status, settings, current_question_index")
    .eq("code", roomCode)
    .single();

  if (!room) notFound();
  if (room.status === "waiting") redirect(`/lobby/${roomCode}`);
  if (room.status === "finished") redirect(`/results/${roomCode}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <GameClient
      roomCode={roomCode}
      userId={user.id}
      displayName={profile?.display_name ?? "Player"}
      isHost={room.host_id === user.id}
      timeLimitMs={(room.settings as { time_per_question_ms: number }).time_per_question_ms}
    />
  );
}
