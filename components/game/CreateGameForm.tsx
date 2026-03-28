"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestionType, RoomSettings } from "@/lib/supabase/types";

const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Fantasy", "Horror", "Mystery",
  "Romance", "Science Fiction", "Thriller", "Western", "Music",
];

const ALL_QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "image_id", label: "Identify the Movie (image)" },
  { value: "quote_fill", label: "Complete the Quote" },
  { value: "trivia", label: "Movie Trivia" },
  { value: "actor_match", label: "Actor → Character Match" },
  { value: "decade", label: "Guess the Decade" },
  { value: "director", label: "Name the Director" },
  { value: "box_office", label: "Box Office & Awards" },
];

const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export default function CreateGameForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [genres, setGenres] = useState<string[]>([...ALL_GENRES]);
  const [decadeStart, setDecadeStart] = useState(1950);
  const [decadeEnd, setDecadeEnd] = useState(2020);
  const [questionCount, setQuestionCount] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(20000);
  const [difficulty, setDifficulty] = useState<RoomSettings["difficulty"]>("mixed");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(
    ALL_QUESTION_TYPES.map((t) => t.value)
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleGenre(g: string) {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function toggleType(t: QuestionType) {
    setQuestionTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleCreate() {
    if (genres.length === 0) {
      setError("Select at least one genre.");
      return;
    }
    if (questionTypes.length === 0) {
      setError("Select at least one question type.");
      return;
    }

    setError(null);
    setLoading(true);

    const settings: RoomSettings = {
      genres,
      decade_start: decadeStart,
      decade_end: decadeEnd,
      question_count: questionCount,
      time_per_question_ms: timePerQuestion,
      difficulty,
      question_types: questionTypes,
    };

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to create room.");
      setLoading(false);
      return;
    }

    const { code } = await res.json();
    router.push(`/lobby/${code}`);
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex gap-2 text-sm">
        {["Genres", "Decades", "Settings", "Review"].map((label, i) => (
          <button
            key={label}
            onClick={() => setStep(i + 1)}
            className={`px-3 py-1 rounded-full transition-colors ${
              step === i + 1
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step 1: Genres */}
      {step === 1 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-lg">Select Genres</h2>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setGenres([...ALL_GENRES])}
                className="text-indigo-400 hover:underline"
              >
                All
              </button>
              <button
                onClick={() => setGenres([])}
                className="text-indigo-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_GENRES.map((g) => (
              <label
                key={g}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                  genres.includes(g)
                    ? "border-indigo-500 bg-indigo-950 text-indigo-200"
                    : "border-gray-700 hover:border-gray-500"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={genres.includes(g)}
                  onChange={() => toggleGenre(g)}
                />
                {g}
              </label>
            ))}
          </div>
          <button
            onClick={() => setStep(2)}
            className="mt-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-2 font-semibold transition-colors"
          >
            Next →
          </button>
        </section>
      )}

      {/* Step 2: Decades */}
      {step === 2 && (
        <section>
          <h2 className="font-semibold text-lg mb-3">Decade Range</h2>
          <p className="text-gray-400 text-sm mb-4">
            Questions will only include movies from this era.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                From: <span className="text-white font-semibold">{decadeStart}s</span>
              </label>
              <input
                type="range"
                min={0}
                max={DECADES.length - 1}
                value={DECADES.indexOf(decadeStart)}
                onChange={(e) => {
                  const d = DECADES[+e.target.value];
                  setDecadeStart(d);
                  if (d > decadeEnd) setDecadeEnd(d);
                }}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                To: <span className="text-white font-semibold">{decadeEnd}s</span>
              </label>
              <input
                type="range"
                min={0}
                max={DECADES.length - 1}
                value={DECADES.indexOf(decadeEnd)}
                onChange={(e) => {
                  const d = DECADES[+e.target.value];
                  setDecadeEnd(d);
                  if (d < decadeStart) setDecadeStart(d);
                }}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4 text-sm">
            {[
              { label: "Classic (pre-1980)", start: 1950, end: 1970 },
              { label: "Modern (2000s+)", start: 2000, end: 2020 },
              { label: "All Time", start: 1950, end: 2020 },
            ].map(({ label, start, end }) => (
              <button
                key={label}
                onClick={() => { setDecadeStart(start); setDecadeEnd(end); }}
                className="rounded-full border border-gray-700 hover:border-gray-500 px-3 py-1"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-gray-700 hover:border-gray-500 px-6 py-2 font-semibold transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-2 font-semibold transition-colors"
            >
              Next →
            </button>
          </div>
        </section>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <section className="space-y-6">
          <h2 className="font-semibold text-lg">Game Settings</h2>

          <div>
            <p className="text-sm text-gray-400 mb-2">Number of Questions</p>
            <div className="flex gap-2">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    questionCount === n
                      ? "bg-indigo-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Time Per Question</p>
            <div className="flex gap-2">
              {[
                { label: "10s", ms: 10000 },
                { label: "20s", ms: 20000 },
                { label: "30s", ms: 30000 },
              ].map(({ label, ms }) => (
                <button
                  key={ms}
                  onClick={() => setTimePerQuestion(ms)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    timePerQuestion === ms
                      ? "bg-indigo-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Difficulty</p>
            <div className="flex gap-2">
              {(["easy", "mixed", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                    difficulty === d
                      ? "bg-indigo-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Question Types</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_QUESTION_TYPES.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    questionTypes.includes(value)
                      ? "border-indigo-500 bg-indigo-950 text-indigo-200"
                      : "border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={questionTypes.includes(value)}
                    onChange={() => toggleType(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-gray-700 hover:border-gray-500 px-6 py-2 font-semibold transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-2 font-semibold transition-colors"
            >
              Review →
            </button>
          </div>
        </section>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <section className="space-y-4">
          <h2 className="font-semibold text-lg">Review & Create</h2>
          <div className="rounded-xl bg-gray-800 p-4 text-sm space-y-2">
            <Row label="Genres" value={genres.join(", ") || "None"} />
            <Row label="Decades" value={`${decadeStart}s – ${decadeEnd}s`} />
            <Row label="Questions" value={questionCount.toString()} />
            <Row label="Time per Q" value={`${timePerQuestion / 1000}s`} />
            <Row label="Difficulty" value={difficulty} />
            <Row
              label="Types"
              value={questionTypes
                .map((t) => ALL_QUESTION_TYPES.find((x) => x.value === t)?.label ?? t)
                .join(", ")}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="rounded-lg border border-gray-700 hover:border-gray-500 px-6 py-2 font-semibold transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-8 py-2 font-semibold transition-colors"
            >
              {loading ? "Creating…" : "Create Game"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
