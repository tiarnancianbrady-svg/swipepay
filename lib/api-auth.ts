import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const connection = await prisma.inboxConnection.findFirst({ where: { userId } });
  if (!connection) {
    return { error: NextResponse.json({ error: "No inbox connection found" }, { status: 400 }) };
  }

  return { userId, connection };
}
