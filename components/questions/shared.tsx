import type { SafeQuestion } from "@/lib/realtime/gameChannel";
import type { GamePhase } from "@/lib/gameStore";

export interface QuestionProps {
  question: SafeQuestion;
  phase: GamePhase;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  onAnswer: (answer: string) => void;
}

export function OptionButton({
  option,
  selected,
  correct,
  phase,
  onClick,
}: {
  option: string;
  selected: boolean;
  correct: boolean;
  phase: GamePhase;
  onClick: () => void;
}) {
  const revealed = phase === "reveal";
  let classes =
    "w-full text-left rounded-xl px-4 py-3 text-sm font-medium border transition-colors ";

  if (revealed) {
    if (correct) {
      classes += "bg-green-800 border-green-500 text-green-100";
    } else if (selected) {
      classes += "bg-red-900 border-red-500 text-red-200";
    } else {
      classes += "bg-gray-800 border-gray-700 text-gray-400 opacity-60";
    }
  } else {
    if (selected) {
      classes += "bg-indigo-800 border-indigo-500";
    } else {
      classes += "bg-gray-800 border-gray-700 hover:border-indigo-400 hover:bg-gray-700";
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={!!selected || revealed}
      className={classes}
    >
      {option}
    </button>
  );
}
