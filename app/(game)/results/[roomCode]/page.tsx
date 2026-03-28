import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Leaderboard from "@/components/game/Leaderboard";

interface Props {
  params: Promise<{ roomCode: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { roomCode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: room } = await supabase
    .from("rooms")
    .select("id, code, status")
    .eq("code", roomCode)
    .single();

  if (!room) notFound();
  if (room.status !== "finished") redirect(`/play/${roomCode}`);

  const { data: results } = await supabase
    .from("game_results")
    .select("player_id, total_score, rank, profiles(display_name)")
    .eq("room_id", room.id)
    .order("rank");

  const leaderboard = (results ?? []).map((r) => ({
    player_id: r.player_id,
    display_name: (r.profiles as unknown as { display_name: string } | null)?.display_name ?? "?",
    score: r.total_score,
    rank: r.rank,
  }));

  const myRank = leaderboard.find((e) => e.player_id === user.id);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 gap-8 max-w-sm mx-auto w-full">
      <h1 className="text-3xl font-bold">Game Over!</h1>

      {myRank && (
        <div className="text-center">
          <p className="text-gray-400 text-sm">Your result</p>
          <p className="text-5xl font-bold mt-1">#{myRank.rank}</p>
          <p className="text-indigo-400 font-mono text-xl mt-1">
            {myRank.score.toLocaleString()} pts
          </p>
        </div>
      )}

      <Leaderboard entries={leaderboard} currentPlayerId={user.id} />

      <div className="flex gap-3 w-full">
        <Link
          href="/"
          className="flex-1 text-center rounded-xl border border-gray-700 hover:border-gray-500 py-3 font-semibold transition-colors"
        >
          Home
        </Link>
        <Link
          href="/create"
          className="flex-1 text-center rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-semibold transition-colors"
        >
          Play Again
        </Link>
      </div>
    </main>
  );
}
