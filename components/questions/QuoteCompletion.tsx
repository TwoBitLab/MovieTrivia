import { QuestionProps, OptionButton } from "./shared";

export default function QuoteCompletion({
  question,
  phase,
  selectedAnswer,
  correctAnswer,
  onAnswer,
}: QuestionProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gray-800 border border-gray-700 px-5 py-4">
        <p className="text-lg italic text-gray-200 leading-relaxed">
          &ldquo;{question.prompt}&rdquo;
        </p>
      </div>
      <p className="text-sm text-gray-400">Complete the famous movie quote:</p>
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
