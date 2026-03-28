import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

/** Server → client broadcast events */
export type GameEvent =
  | {
      type: "question_start";
      payload: {
        question_index: number;
        question: SafeQuestion;
        time_limit_ms: number;
        started_at: number; // epoch ms, for client-side sync
      };
    }
  | {
      type: "question_end";
      payload: {
        question_index: number;
        correct_answer: string;
        leaderboard: LeaderboardEntry[];
      };
    }
  | { type: "game_paused"; payload: Record<string, never> }
  | { type: "game_resumed"; payload: Record<string, never> }
  | {
      type: "game_finished";
      payload: { final_leaderboard: LeaderboardEntry[] };
    };

/** Client → client broadcast events */
export type ClientEvent =
  | { type: "player_joined"; payload: { display_name: string; player_id: string } }
  | { type: "answer_submitted"; payload: { player_id: string } };

/** Question sent to clients — correct_answer is omitted */
export type SafeQuestion = Omit<
  Database["public"]["Tables"]["questions"]["Row"],
  "correct_answer" | "wrong_answers"
> & {
  options: string[]; // shuffled [correct + wrongs], correct_answer NOT included
};

export interface LeaderboardEntry {
  player_id: string;
  display_name: string;
  score: number;
  rank: number;
}

type EventHandler = (event: GameEvent | ClientEvent) => void;

export function subscribeToRoom(
  roomCode: string,
  onEvent: EventHandler
): RealtimeChannel {
  const supabase = createClient();
  const channel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: false } },
  });

  channel.on("broadcast", { event: "*" }, ({ event, payload }) => {
    onEvent({ type: event, payload } as GameEvent | ClientEvent);
  });

  channel.subscribe();
  return channel;
}

export async function broadcastToRoom(
  roomCode: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createClient();
  await supabase.channel(`room:${roomCode}`).send({
    type: "broadcast",
    event,
    payload,
  });
}
