import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoomCode from "@/components/game/RoomCode";
import LobbyClient from "@/components/game/LobbyClient";

interface Props {
  params: Promise<{ roomCode: string }>;
}

export default async function LobbyPage({ params }: Props) {
  const { roomCode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("*, room_players(player_id, is_host, profiles(display_name))")
    .eq("code", roomCode)
    .single();

  if (!room) notFound();
  if (room.status === "active") redirect(`/play/${roomCode}`);
  if (room.status === "finished") redirect(`/results/${roomCode}`);

  const players = (room.room_players as Array<{
    player_id: string;
    is_host: boolean;
    profiles: { display_name: string } | null;
  }>).map((rp) => ({
    player_id: rp.player_id,
    display_name: rp.profiles?.display_name ?? "Unknown",
    is_host: rp.is_host,
  }));

  const isHost = room.host_id === user.id;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 gap-8">
      <RoomCode code={room.code} />
      <LobbyClient
        roomCode={room.code}
        initialPlayers={players}
        isHost={isHost}
        hostId={room.host_id}
        userId={user.id}
      />
    </main>
  );
}
