"use client";

import { signIn } from "next-auth/react";

type SignInButtonProps = {
  disabled?: boolean;
};

export function SignInButton({ disabled = false }: SignInButtonProps) {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      disabled={disabled}
      className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      Sign in with Google
    </button>
  );
}
