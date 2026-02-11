import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database is reachable.");
  } catch (error) {
    const maybeCode =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    const maybeMessage =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

    if (maybeCode === "P1001" || maybeMessage.includes("Can't reach database server")) {
      console.error("❌ Cannot connect to Postgres (Prisma P1001).");
      console.error("   Start DB with: docker compose up -d");
      console.error("   Check DATABASE_URL and docker-compose Postgres port mapping.");
      process.exit(1);
    }

    console.error("❌ Database check failed.");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
