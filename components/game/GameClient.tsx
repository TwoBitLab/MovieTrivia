"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/gameStore";
import { subscribeToRoom } from "@/lib/realtime/gameChannel";
import type { RealtimeChannel } from "@supabase/supabase-js";
import CountdownTimer from "./CountdownTimer";
import Leaderboard from "./Leaderboard";
import QuestionRenderer from "./QuestionRenderer";

interface Props {
  roomCode: string;
  userId: string;
  displayName: string;
  isHost: boolean;
  timeLimitMs: number;
}

export default function GameClient({
  roomCode,
  userId,
  isHost,
  timeLimitMs,
}: Props) {
  const router = useRouter();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const answerTimeRef = useRef<number | null>(null);

  const {
    phase,
    currentQuestion,
    currentQuestionIndex,
    questionStartedAt,
    selectedAnswer,
    lastCorrectAnswer,
    leaderboard,
    setQuestion,
    setAnswer,
    revealAnswer,
    setLeaderboard,
    setIsHost,
  } = useGameStore();

  useEffect(() => {
    setIsHost(isHost);

    channelRef.current = subscribeToRoom(roomCode, (event) => {
      if (event.type === "question_start") {
        setQuestion(
          event.payload.question,
          event.payload.question_index,
          event.payload.time_limit_ms,
          event.payload.started_at
        );
        answerTimeRef.current = null;
      }
      if (event.type === "question_end") {
        revealAnswer(event.payload.correct_answer, event.payload.leaderboard);
      }
      if (event.type === "game_finished") {
        router.push(`/results/${roomCode}`);
      }
    });

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [roomCode, isHost, setQuestion, revealAnswer, setIsHost, setLeaderboard, router]);

  async function handleAnswer(answer: string) {
    if (selectedAnswer || !questionStartedAt) return;
    const timeTakenMs = Date.now() - questionStartedAt;
    setAnswer(answer);

    await fetch(`/api/rooms/${roomCode}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: currentQuestion?.id,
        answer,
        time_taken_ms: timeTakenMs,
      }),
    });
  }

  async function handleNext() {
    await fetch(`/api/rooms/${roomCode}/next`, { method: "POST" });
  }

  async function handlePause() {
    await fetch(`/api/rooms/${roomCode}/pause`, { method: "POST" });
  }

  return (
    <main className="flex flex-1 flex-col md:flex-row gap-4 p-4 max-w-5xl mx-auto w-full">
      {/* Main game area */}
      <div className="flex-1 space-y-4">
        {phase === "waiting" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Waiting for the first question…</p>
          </div>
        )}

        {(phase === "question" || phase === "reveal") && currentQuestion && (
          <>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Question {currentQuestionIndex + 1}</span>
              {phase === "reveal" && lastCorrectAnswer && (
                <span
                  className={
                    selectedAnswer === lastCorrectAnswer
                      ? "text-green-400 font-semibold"
                      : "text-red-400 font-semibold"
                  }
                >
                  {selectedAnswer === lastCorrectAnswer ? "Correct!" : "Wrong"}
                </span>
              )}
            </div>

            {phase === "question" && questionStartedAt && (
              <CountdownTimer
                startedAt={questionStartedAt}
                timeLimitMs={timeLimitMs}
              />
            )}

            <QuestionRenderer
              question={currentQuestion}
              phase={phase}
              selectedAnswer={selectedAnswer}
              correctAnswer={phase === "reveal" ? lastCorrectAnswer : null}
              onAnswer={handleAnswer}
            />

            {isHost && phase === "reveal" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleNext}
                  className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 font-semibold transition-colors"
                >
                  Next Question →
                </button>
                <button
                  onClick={handlePause}
                  className="rounded-lg border border-gray-700 hover:border-gray-500 px-4 py-2 text-sm transition-colors"
                >
                  Pause
                </button>
              </div>
            )}
          </>
        )}

        {phase === "finished" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">Game finished! Redirecting…</p>
          </div>
        )}
      </div>

      {/* Sidebar leaderboard */}
      <aside className="md:w-64 shrink-0">
        <Leaderboard entries={leaderboard} currentPlayerId={userId} />
      </aside>
    </main>
  );
}
