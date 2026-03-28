"use client";

import { create } from "zustand";
import type { SafeQuestion, LeaderboardEntry } from "./realtime/gameChannel";

export type GamePhase =
  | "waiting"
  | "question"
  | "reveal"
  | "finished";

interface GameState {
  phase: GamePhase;
  currentQuestion: SafeQuestion | null;
  currentQuestionIndex: number;
  timeLimitMs: number;
  questionStartedAt: number | null; // epoch ms
  selectedAnswer: string | null;
  lastCorrectAnswer: string | null;
  leaderboard: LeaderboardEntry[];
  players: Array<{ player_id: string; display_name: string }>;
  isHost: boolean;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setQuestion: (q: SafeQuestion, index: number, timeLimitMs: number, startedAt: number) => void;
  setAnswer: (answer: string) => void;
  revealAnswer: (correctAnswer: string, leaderboard: LeaderboardEntry[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  addPlayer: (player: { player_id: string; display_name: string }) => void;
  setIsHost: (v: boolean) => void;
  reset: () => void;
}

const initial = {
  phase: "waiting" as GamePhase,
  currentQuestion: null,
  currentQuestionIndex: 0,
  timeLimitMs: 20000,
  questionStartedAt: null,
  selectedAnswer: null,
  lastCorrectAnswer: null,
  leaderboard: [],
  players: [],
  isHost: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initial,

  setPhase: (phase) => set({ phase }),

  setQuestion: (question, index, timeLimitMs, startedAt) =>
    set({
      phase: "question",
      currentQuestion: question,
      currentQuestionIndex: index,
      timeLimitMs,
      questionStartedAt: startedAt,
      selectedAnswer: null,
      lastCorrectAnswer: null,
    }),

  setAnswer: (answer) => set({ selectedAnswer: answer }),

  revealAnswer: (correctAnswer, leaderboard) =>
    set({ phase: "reveal", lastCorrectAnswer: correctAnswer, leaderboard }),

  setLeaderboard: (entries) => set({ leaderboard: entries }),

  addPlayer: (player) =>
    set((s) => ({
      players: s.players.some((p) => p.player_id === player.player_id)
        ? s.players
        : [...s.players, player],
    })),

  setIsHost: (v) => set({ isHost: v }),

  reset: () => set(initial),
}));
