import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Profile — Movie Trivia" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, total_score, games_played, created_at")
    .eq("id", user.id)
    .single();

  const { data: history } = await supabase
    .from("game_results")
    .select("total_score, rank, played_at, rooms(code)")
    .eq("player_id", user.id)
    .order("played_at", { ascending: false })
    .limit(20);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 max-w-2xl mx-auto w-full gap-8">
      <section className="w-full rounded-2xl bg-gray-800 p-6">
        <h1 className="text-2xl font-bold mb-1">
          {profile?.display_name ?? "Player"}
        </h1>
        <p className="text-gray-400 text-sm mb-4">
          {user.email ?? "Anonymous"}
        </p>
        <div className="flex gap-6">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Total Score</p>
            <p className="text-2xl font-mono font-bold">
              {(profile?.total_score ?? 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Games Played</p>
            <p className="text-2xl font-mono font-bold">
              {profile?.games_played ?? 0}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full">
        <h2 className="text-lg font-semibold mb-3">Recent Games</h2>
        {history?.length ? (
          <ul className="space-y-2">
            {history.map((r) => (
              <li
                key={`${r.played_at}`}
                className="flex items-center justify-between rounded-xl bg-gray-800 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="font-mono text-gray-400">
                    #{r.rank}
                  </span>
                  <span className="text-gray-300">
                    Room {(r.rooms as unknown as { code: string } | null)?.code ?? "—"}
                  </span>
                </span>
                <span className="font-mono font-bold">
                  {r.total_score.toLocaleString()} pts
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No games played yet.</p>
        )}
      </section>

      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg border border-gray-700 hover:border-gray-500 px-5 py-2 text-sm font-semibold transition-colors"
        >
          Home
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-semibold transition-colors"
        >
          Leaderboard
        </Link>
      </div>
    </main>
  );
}
