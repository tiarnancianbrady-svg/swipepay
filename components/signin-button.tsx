"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
    >
      Sign in with Google
    </button>
  );
}
