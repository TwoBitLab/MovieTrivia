import type { SafeQuestion } from "@/lib/realtime/gameChannel";
import type { GamePhase } from "@/lib/gameStore";
import ImageIdentification from "@/components/questions/ImageIdentification";
import QuoteCompletion from "@/components/questions/QuoteCompletion";
import MultipleChoiceTrivia from "@/components/questions/MultipleChoiceTrivia";
import ActorCharacterMatch from "@/components/questions/ActorCharacterMatch";
import DecadeGuess from "@/components/questions/DecadeGuess";
import DirectorIdentification from "@/components/questions/DirectorIdentification";
import BoxOfficeTrivia from "@/components/questions/BoxOfficeTrivia";

interface Props {
  question: SafeQuestion;
  phase: GamePhase;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  onAnswer: (answer: string) => void;
}

export default function QuestionRenderer(props: Props) {
  switch (props.question.type) {
    case "image_id":
      return <ImageIdentification {...props} />;
    case "quote_fill":
      return <QuoteCompletion {...props} />;
    case "trivia":
      return <MultipleChoiceTrivia {...props} />;
    case "actor_match":
      return <ActorCharacterMatch {...props} />;
    case "decade":
      return <DecadeGuess {...props} />;
    case "director":
      return <DirectorIdentification {...props} />;
    case "box_office":
      return <BoxOfficeTrivia {...props} />;
    default:
      return <MultipleChoiceTrivia {...props} />;
  }
}
