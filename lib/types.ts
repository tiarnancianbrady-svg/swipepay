export type ExtractionOutput = {
  vendorName: string;
  vendorDomain: string | null;
  amount: number;
  currency: string;
  frequency: "monthly" | "quarterly" | "annual" | "unknown";
  frequencyConfidence: number;
  serviceDescription: string;
  invoiceNumber: string | null;
  dueDate: string | null;
};
