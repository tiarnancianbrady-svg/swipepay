import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getSwipeLeftPatch, swipeLeftSchema } from "@/lib/invoice-actions";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authState = await requireUser();
  if (authState.error) return authState.error;

  const payload = await req.json().catch(() => ({}));
  const parsed = swipeLeftSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invoice = await prisma.invoice.updateMany({
    where: { id: params.id, connectionId: authState.connection.id },
    data: getSwipeLeftPatch(parsed.data.note),
  });

  if (!invoice.count) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  await prisma.actionLog.create({
    data: { invoiceId: params.id, userId: authState.userId, actionType: "SWIPE_LEFT", note: parsed.data.note },
  });

  return NextResponse.json({ ok: true });
}
