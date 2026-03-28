import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        🎬 Movie Trivia
      </h1>
      <p className="text-gray-400 text-lg mb-10 max-w-md">
        Challenge your friends to a live movie quiz. Pick genres, set the
        decade, and see who knows their films best.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/create"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3 text-lg font-semibold transition-colors"
        >
          Create a Game
        </Link>
        <Link
          href="/join"
          className="rounded-xl border border-gray-700 hover:border-gray-500 px-8 py-3 text-lg font-semibold transition-colors"
        >
          Join a Game
        </Link>
      </div>

      {!user && (
        <p className="mt-8 text-sm text-gray-500">
          <Link href="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>{" "}
          to save your scores and climb the leaderboard.
        </p>
      )}

      {user && (
        <p className="mt-8 text-sm text-gray-500">
          Signed in as{" "}
          <Link href="/profile" className="text-indigo-400 hover:underline">
            {user.email ?? "Anonymous"}
          </Link>
          {" · "}
          <Link href="/leaderboard" className="text-indigo-400 hover:underline">
            Leaderboard
          </Link>
        </p>
      )}
    </main>
  );
}
