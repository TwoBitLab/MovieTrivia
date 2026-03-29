"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleAnonymous() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const displayName = `Player${Math.floor(Math.random() * 9000) + 1000}`;
    const { error } = await supabase.auth.signInAnonymously({
      options: { data: { display_name: displayName, is_anonymous: true } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            className="block text-sm text-gray-400 mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2 font-semibold transition-colors"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-2 text-gray-600">
        <hr className="flex-1 border-gray-700" />
        <span className="text-xs">or</span>
        <hr className="flex-1 border-gray-700" />
      </div>

      <button
        onClick={handleAnonymous}
        disabled={loading}
        className="w-full rounded-lg border border-gray-700 hover:border-gray-500 disabled:opacity-50 py-2 text-sm font-semibold transition-colors"
      >
        Play as Guest
      </button>

      <p className="mt-6 text-sm text-gray-500 text-center">
        No account?{" "}
        <Link href="/register" className="text-indigo-400 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
