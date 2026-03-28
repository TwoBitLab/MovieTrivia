import CreateGameForm from "@/components/game/CreateGameForm";

export const metadata = { title: "Create Game — Movie Trivia" };

export default function CreatePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Create a Game</h1>
        <p className="text-gray-400 mb-8">
          Configure your quiz and share the room code with friends.
        </p>
        <CreateGameForm />
      </div>
    </main>
  );
}
