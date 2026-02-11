import { SignInButton } from "@/components/signin-button";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-3xl font-bold">Connect your AP inbox</h1>
      <p className="text-slate-600">Use Google OAuth with read-only Gmail permissions.</p>
      <SignInButton />
    </main>
  );
}
