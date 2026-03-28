import { QuestionProps, OptionButton } from "./shared";

export default function BoxOfficeTrivia({
  question,
  phase,
  selectedAnswer,
  correctAnswer,
  onAnswer,
}: QuestionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
        <span>🏆</span>
        <span>Box Office &amp; Awards</span>
      </div>
      <p className="font-semibold text-lg leading-snug">{question.prompt}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt) => (
          <OptionButton
            key={opt}
            option={opt}
            selected={selectedAnswer === opt}
            correct={correctAnswer === opt}
            phase={phase}
            onClick={() => onAnswer(opt)}
          />
        ))}
      </div>
    </div>
  );
}
