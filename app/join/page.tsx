import JoinRoomForm from "@/components/game/JoinRoomForm";

export const metadata = { title: "Join Game — Movie Trivia" };

export default function JoinPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">Join a Game</h1>
        <p className="text-gray-400 mb-8">Enter the 6-character room code.</p>
        <JoinRoomForm />
      </div>
    </main>
  );
}
