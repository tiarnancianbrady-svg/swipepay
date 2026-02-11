import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">SwipePay</h1>
      <p className="text-slate-600">Swipe through AP invoices and route them in seconds.</p>
      <Link
        href="/signin"
        className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
      >
        Sign in with Google
      </Link>
    </main>
  );
}
