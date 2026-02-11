import { CalendarDays, Hash, ReceiptText } from "lucide-react";
import { VendorLogo } from "@/components/vendor-logo";

type Invoice = {
  id: string;
  vendorName: string;
  vendorDomain?: string | null;
  logoUrl: string | null;
  amountCents: number;
  currency: string;
  frequency: string;
  frequencyConfidence: number;
  serviceDescription: string;
  invoiceFileUrl: string;
  invoiceNumber?: string | null;
  createdAt?: string;
};

function fmtCurrency(amountCents: number, currency: string) {
  return (amountCents / 100).toLocaleString(undefined, { style: "currency", currency });
}

export function InvoiceCard({ invoice, swipeHint }: { invoice: Invoice; swipeHint: "left" | "right" | null }) {
  return (
    <article className="relative flex h-[72vh] min-h-[560px] w-[min(92vw,680px)] max-w-[680px] flex-col rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur md:h-[78vh] md:min-h-[620px] md:p-8">
      {swipeHint && (
        <div
          className={`pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 rotate-[-8deg] rounded-xl border-2 px-4 py-2 text-sm font-black tracking-[0.24em] md:text-base ${
            swipeHint === "right"
              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
              : "rotate-[8deg] border-rose-600 bg-rose-50 text-rose-700"
          }`}
        >
          {swipeHint === "right" ? "APPROVE" : "NEEDS INFO"}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <VendorLogo vendorName={invoice.vendorName} logoUrl={invoice.logoUrl} vendorDomain={invoice.vendorDomain} size={76} />
          <div>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{invoice.vendorName}</p>
            <p className="mt-1 text-sm text-slate-500 md:text-base">
              {invoice.frequency} • {Math.round(invoice.frequencyConfidence * 100)}% confidence
            </p>
          </div>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700 md:text-sm">
          Inbox
        </span>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-900 px-5 py-6 text-white shadow-inner md:px-6 md:py-7">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Invoice amount</p>
        <p className="mt-1 text-4xl font-bold tracking-tight md:text-6xl">{fmtCurrency(invoice.amountCents, invoice.currency)}</p>
      </div>

      <p className="mt-6 line-clamp-3 text-base text-slate-700 md:text-lg">{invoice.serviceDescription}</p>

      <dl className="mt-6 space-y-3 text-sm text-slate-600 md:text-base">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-500" />
          <dt className="font-medium text-slate-700">Received:</dt>
          <dd>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "-"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Hash size={16} className="text-slate-500" />
          <dt className="font-medium text-slate-700">Invoice #:</dt>
          <dd>{invoice.invoiceNumber || "Not provided"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <ReceiptText size={16} className="text-slate-500" />
          <dt className="font-medium text-slate-700">Category:</dt>
          <dd>{invoice.frequency}</dd>
        </div>
      </dl>

      <a
        href={invoice.invoiceFileUrl}
        className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        target="_blank"
        rel="noreferrer"
        aria-label={`View invoice file for ${invoice.vendorName}`}
      >
        View invoice
      </a>
    </article>
  );
}
