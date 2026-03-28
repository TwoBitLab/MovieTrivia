import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = { title: "Register — Movie Trivia" };

export default function RegisterPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <RegisterForm />
    </main>
  );
}
