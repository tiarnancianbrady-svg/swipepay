import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const authState = await requireUser();
  if (authState.error) return authState.error;

  const attachment = await prisma.invoiceAttachment.findFirst({
    where: { invoiceId: params.id, invoice: { connectionId: authState.connection.id } },
    orderBy: { createdAt: "asc" },
  });

  if (!attachment) {
    return NextResponse.json({ error: "No attachment" }, { status: 404 });
  }

  const fullPath = path.join(process.cwd(), "uploads", attachment.storageUrl);
  const file = await fs.readFile(fullPath).catch(() => null);
  if (!file) {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  return new NextResponse(file, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename=\"${attachment.filename}\"`,
    },
  });
}
