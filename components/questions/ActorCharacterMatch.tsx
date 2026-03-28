import Image from "next/image";
import { QuestionProps, OptionButton } from "./shared";
import type { QuestionMetadata } from "@/lib/supabase/types";

export default function ActorCharacterMatch({
  question,
  phase,
  selectedAnswer,
  correctAnswer,
  onAnswer,
}: QuestionProps) {
  const meta = question.metadata as QuestionMetadata | null;
  // The prompt identifies the actor; options are character names
  // metadata.actors may contain actor photos for display

  const actorEntry = meta?.actors?.[0];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Which character did this actor play?</p>

      {actorEntry?.image_url && (
        <div className="flex justify-center">
          <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-600">
            <Image
              src={actorEntry.image_url}
              alt={actorEntry.actor_name}
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
        </div>
      )}

      <p className="font-semibold text-lg text-center">{question.prompt}</p>

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
