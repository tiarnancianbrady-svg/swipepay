import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";

const querySchema = z.object({
  status: z.enum(["INBOX", "APPROVAL_QUEUE", "NEEDS_INFO"]).default("INBOX"),
});

export async function GET(req: NextRequest) {
  const authState = await requireUser();
  if (authState.error) return authState.error;

  const parsed = querySchema.safeParse({ status: req.nextUrl.searchParams.get("status") ?? "INBOX" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { connectionId: authState.connection.id, status: parsed.data.status },
    orderBy: { createdAt: "desc" },
    include: { attachments: true },
  });

  return NextResponse.json({ invoices });
}
