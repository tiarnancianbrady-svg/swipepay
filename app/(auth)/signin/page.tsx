import { SignInButton } from "@/components/signin-button";
import { getMissingGoogleAuthEnvVars, isGoogleAuthConfigured } from "@/lib/auth-config";

export default function SignInPage() {
  const oauthConfigured = isGoogleAuthConfigured();
  const missingVars = getMissingGoogleAuthEnvVars();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-3xl font-bold">Connect your AP inbox</h1>
      <p className="text-slate-600">Use Google OAuth with read-only Gmail permissions.</p>
      {!oauthConfigured ? (
        <div className="w-full rounded-md border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800">
          <p className="font-semibold">Google sign-in is not fully configured.</p>
          <p className="mt-1">Set the missing environment variables, then restart the app:</p>
          <ul className="mt-2 list-inside list-disc font-mono text-xs">
            {missingVars.map((envVar) => (
              <li key={envVar}>{envVar}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs">
            Also add this redirect URI in Google Cloud OAuth settings:
            <span className="mt-1 block rounded bg-amber-100 px-2 py-1 font-mono">
              {`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`}
            </span>
          </p>
        </div>
      ) : null}
      <SignInButton disabled={!oauthConfigured} />
    </main>
  );
}
