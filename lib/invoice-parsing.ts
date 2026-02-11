import OpenAI from "openai";
import { z } from "zod";
import { ExtractionOutput } from "@/lib/types";

const extractionSchema = z.object({
  vendorName: z.string().min(1).default("Unknown Vendor"),
  vendorDomain: z.string().nullable(),
  amount: z.number().nonnegative().default(0),
  currency: z.string().min(1).default("USD"),
  frequency: z.enum(["monthly", "quarterly", "annual", "unknown"]).default("unknown"),
  frequencyConfidence: z.number().min(0).max(1).default(0),
  serviceDescription: z.string().min(1).default("Invoice related services"),
  invoiceNumber: z.string().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

const frequencyMap = {
  monthly: "MONTHLY",
  quarterly: "QUARTERLY",
  annual: "ANNUAL",
  unknown: "UNKNOWN",
} as const;

const model = "gpt-4o-mini";

export function toAmountCents(amount: number): number {
  return Math.round((Number.isFinite(amount) ? amount : 0) * 100);
}

export function mapExtractionToInvoiceFields(extracted: ExtractionOutput) {
  return {
    vendorName: extracted.vendorName || "Unknown Vendor",
    vendorDomain: extracted.vendorDomain,
    logoUrl: extracted.vendorDomain ? `https://logo.clearbit.com/${extracted.vendorDomain}` : null,
    amountCents: toAmountCents(extracted.amount),
    currency: extracted.currency || "USD",
    frequency: frequencyMap[extracted.frequency],
    frequencyConfidence: extracted.frequencyConfidence,
    serviceDescription: extracted.serviceDescription,
    invoiceNumber: extracted.invoiceNumber,
    dueDate: extracted.dueDate ? new Date(extracted.dueDate) : null,
    extractedJson: extracted,
  };
}

function fallbackParse(text: string): ExtractionOutput {
  const amountMatch = text.match(/(?:\$|USD\s?)(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 0;
  const currency = text.includes("€") ? "EUR" : text.includes("£") ? "GBP" : "USD";

  return {
    vendorName: "Unknown Vendor",
    vendorDomain: null,
    amount,
    currency,
    frequency: /monthly/i.test(text)
      ? "monthly"
      : /quarterly/i.test(text)
        ? "quarterly"
        : /annual|yearly/i.test(text)
          ? "annual"
          : "unknown",
    frequencyConfidence: 0.35,
    serviceDescription: "Parsed from email text fallback",
    invoiceNumber: null,
    dueDate: null,
  };
}

export async function extractInvoiceData(text: string): Promise<ExtractionOutput> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackParse(text);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract invoice metadata from email or OCR text. Return JSON strictly with vendorName,vendorDomain,amount,currency,frequency,frequencyConfidence,serviceDescription,invoiceNumber,dueDate.",
        },
        { role: "user", content: text.slice(0, 12000) },
      ],
    });

    const raw = response.choices[0]?.message.content || "{}";
    return extractionSchema.parse(JSON.parse(raw));
  } catch {
    return fallbackParse(text);
  }
}
