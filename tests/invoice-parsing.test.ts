import { describe, expect, it } from "vitest";
import { mapExtractionToInvoiceFields, toAmountCents } from "@/lib/invoice-parsing";

describe("invoice parsing mapping", () => {
  it("maps extraction JSON to invoice fields", () => {
    const mapped = mapExtractionToInvoiceFields({
      vendorName: "Acme Corp",
      vendorDomain: "acme.com",
      amount: 123.45,
      currency: "USD",
      frequency: "monthly",
      frequencyConfidence: 0.88,
      serviceDescription: "Subscription",
      invoiceNumber: "INV-1",
      dueDate: "2026-02-20",
    });

    expect(mapped.vendorName).toBe("Acme Corp");
    expect(mapped.amountCents).toBe(12345);
    expect(mapped.frequency).toBe("MONTHLY");
    expect(mapped.logoUrl).toContain("acme.com");
  });

  it("converts amount safely", () => {
    expect(toAmountCents(1.999)).toBe(200);
  });
});
