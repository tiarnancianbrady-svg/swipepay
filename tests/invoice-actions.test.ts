import { describe, expect, it } from "vitest";
import { getSwipeLeftPatch, getSwipeRightPatch, swipeLeftSchema } from "@/lib/invoice-actions";

describe("invoice action logic", () => {
  it("requires note for swipe left", () => {
    const parsed = swipeLeftSchema.safeParse({ note: "   " });
    expect(parsed.success).toBe(false);
  });

  it("returns expected status transitions", () => {
    expect(getSwipeRightPatch().status).toBe("APPROVAL_QUEUE");
    expect(getSwipeLeftPatch("Need missing PO").status).toBe("NEEDS_INFO");
  });
});
