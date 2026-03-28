import Image from "next/image";
import { QuestionProps, OptionButton } from "./shared";

export default function ImageIdentification({
  question,
  phase,
  selectedAnswer,
  correctAnswer,
  onAnswer,
}: QuestionProps) {
  return (
    <div className="space-y-4">
      {question.image_url && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-800">
          <Image
            src={question.image_url}
            alt="Movie still"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}
      <p className="font-semibold text-lg">{question.prompt}</p>
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
