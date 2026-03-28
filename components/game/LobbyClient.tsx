"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PlayerList from "./PlayerList";
import { useGameStore } from "@/lib/gameStore";
import { subscribeToRoom } from "@/lib/realtime/gameChannel";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Props {
  roomCode: string;
  initialPlayers: Array<{ player_id: string; display_name: string; is_host: boolean }>;
  isHost: boolean;
  hostId: string;
  userId: string;
}

export default function LobbyClient({
  roomCode,
  initialPlayers,
  isHost,
  hostId,
  userId,
}: Props) {
  const router = useRouter();
  const { players, addPlayer, setIsHost } = useGameStore();
  const [starting, setStarting] = React.useState(false);

  useEffect(() => {
    setIsHost(isHost);
    initialPlayers.forEach((p) => addPlayer(p));

    let channel: RealtimeChannel;
    channel = subscribeToRoom(roomCode, (event) => {
      if (event.type === "player_joined") {
        addPlayer(event.payload);
      }
      if (event.type === "question_start") {
        router.push(`/play/${roomCode}`);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [roomCode, initialPlayers, isHost, addPlayer, setIsHost, router]);

  async function handleStart() {
    setStarting(true);
    await fetch(`/api/rooms/${roomCode}/start`, { method: "POST" });
  }

  const allPlayers = players.length > 0 ? players : initialPlayers;

  return (
    <div className="w-full max-w-sm space-y-6">
      <PlayerList players={allPlayers} hostId={hostId} />

      {isHost && (
        <button
          onClick={handleStart}
          disabled={starting || allPlayers.length < 1}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-3 font-semibold transition-colors"
        >
          {starting ? "Starting…" : "Start Game"}
        </button>
      )}

      {!isHost && (
        <p className="text-center text-gray-400 text-sm">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}

// Need React for useState in the same file
import React from "react";
