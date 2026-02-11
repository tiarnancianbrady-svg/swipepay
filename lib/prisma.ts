import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

const getPrismaConnectionErrorHint = (error: unknown): string | null => {
  if (!error || typeof error !== "object") return null;

  const maybeCode = "code" in error ? (error as { code?: string }).code : undefined;
  const maybeMessage = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";

  if (maybeCode === "P1001" || maybeMessage.includes("Can't reach database server")) {
    return [
      "Database connection failed (Prisma P1001 / unreachable server).",
      "Start DB with: docker compose up -d",
      "Check DATABASE_URL and mapped Postgres port in docker-compose.yml.",
    ].join(" ");
  }

  return null;
};

void prisma.$connect().catch((error) => {
  const hint = getPrismaConnectionErrorHint(error);
  if (hint) {
    console.error(hint);
  }
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
