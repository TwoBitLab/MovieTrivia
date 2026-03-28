"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoomForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("Room code must be 6 characters.");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch(`/api/rooms/${trimmed}/join`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Room not found.");
      setLoading(false);
      return;
    }

    router.push(`/lobby/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ROOM CODE"
        maxLength={6}
        className="w-full rounded-xl bg-gray-800 border border-gray-700 px-4 py-4 text-center text-3xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
        autoFocus
      />
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 font-semibold transition-colors"
      >
        {loading ? "Joining…" : "Join Game"}
      </button>
    </form>
  );
}
