import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getSwipeRightPatch } from "@/lib/invoice-actions";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const authState = await requireUser();
  if (authState.error) return authState.error;

  const invoice = await prisma.invoice.updateMany({
    where: { id: params.id, connectionId: authState.connection.id },
    data: getSwipeRightPatch(),
  });

  if (!invoice.count) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  await prisma.actionLog.create({
    data: { invoiceId: params.id, userId: authState.userId, actionType: "SWIPE_RIGHT" },
  });

  return NextResponse.json({ ok: true });
}
