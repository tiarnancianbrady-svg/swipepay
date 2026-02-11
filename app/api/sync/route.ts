import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api-auth";
import { syncGmailInbox } from "@/lib/gmail";

const bodySchema = z.object({ days: z.number().min(1).max(365).default(90) });

export async function POST(req: NextRequest) {
  const authState = await requireUser();
  if (authState.error) return authState.error;

  const payload = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await syncGmailInbox(authState.connection.id, parsed.data.days);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
