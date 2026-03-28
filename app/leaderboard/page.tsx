import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Leaderboard — Movie Trivia" };
export const revalidate = 60; // revalidate every 60s

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: top } = await supabase
    .from("profiles")
    .select("id, display_name, total_score, games_played")
    .order("total_score", { ascending: false })
    .limit(50);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">All-Time Leaderboard</h1>
      <p className="text-gray-400 text-sm mb-8">Top 50 registered players</p>

      <ol className="w-full space-y-2">
        {(top ?? []).map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
              p.id === user?.id ? "bg-indigo-900" : "bg-gray-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="w-6 text-right text-gray-500 font-mono">{i + 1}</span>
              <span className="font-medium">{p.display_name}</span>
              {p.id === user?.id && (
                <span className="text-xs text-indigo-400">(you)</span>
              )}
            </span>
            <span className="flex items-center gap-4 text-right">
              <span className="text-gray-400 text-xs hidden sm:block">
                {p.games_played} games
              </span>
              <span className="font-mono font-bold tabular-nums">
                {p.total_score.toLocaleString()}
              </span>
            </span>
          </li>
        ))}
        {!top?.length && (
          <li className="text-center text-gray-500 py-10">
            No scores yet. Be the first!
          </li>
        )}
      </ol>
    </main>
  );
}
