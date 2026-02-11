const requiredGoogleAuthEnvVars = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

type GoogleAuthEnvVar = (typeof requiredGoogleAuthEnvVars)[number];

export function getMissingGoogleAuthEnvVars(env = process.env): GoogleAuthEnvVar[] {
  return requiredGoogleAuthEnvVars.filter((key) => !env[key]?.trim());
}

export function isGoogleAuthConfigured(env = process.env): boolean {
  return getMissingGoogleAuthEnvVars(env).length === 0;
}

