import { QuestionProps, OptionButton } from "./shared";

export default function MultipleChoiceTrivia({
  question,
  phase,
  selectedAnswer,
  correctAnswer,
  onAnswer,
}: QuestionProps) {
  return (
    <div className="space-y-4">
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
