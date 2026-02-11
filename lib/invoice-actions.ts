import { z } from "zod";

export const swipeLeftSchema = z.object({ note: z.string().trim().min(1, "Note is required") });

export function getSwipeRightPatch() {
  return { status: "APPROVAL_QUEUE" as const, needsInfoNote: null };
}

export function getSwipeLeftPatch(note: string) {
  const parsed = swipeLeftSchema.parse({ note });
  return { status: "NEEDS_INFO" as const, needsInfoNote: parsed.note };
}
