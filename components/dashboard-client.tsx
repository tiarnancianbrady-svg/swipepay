"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { CardDeck } from "@/components/card-deck";

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
  needsInfoNote?: string | null;
  createdAt: string;
};

export function DashboardClient({ seedInvoices }: { seedInvoices: Invoice[] }) {
  const [tab, setTab] = useState<"INBOX" | "APPROVAL_QUEUE" | "NEEDS_INFO">("INBOX");
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);
  const [isSyncing, setIsSyncing] = useState(false);

  const load = useCallback(async (status: typeof tab) => {
    const response = await fetch(`/api/invoices?status=${status}`);
    const data = await response.json();
    setInvoices(data.invoices || []);
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const sorted = useMemo(
    () => [...invoices].sort((a, b) => b.amountCents - a.amountCents || +new Date(b.createdAt) - +new Date(a.createdAt)),
    [invoices],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 md:w-auto">
          {[
            ["INBOX", "Inbox"],
            ["APPROVAL_QUEUE", "Approval Queue"],
            ["NEEDS_INFO", "Needs More Info"],
          ].map(([status, label]) => (
            <button
              key={status}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition md:px-5 md:text-base ${
                tab === status ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => setTab(status as typeof tab)}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-60"
          disabled={isSyncing}
          onClick={async () => {
            setIsSyncing(true);
            try {
              await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days: 90 }),
              });
              await load(tab);
            } finally {
              setIsSyncing(false);
            }
          }}
        >
          <RefreshCcw size={16} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing ? "Syncing..." : "Sync inbox"}
        </button>
      </div>

      {tab === "INBOX" ? (
        <CardDeck initialInvoices={invoices} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-600">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                {tab === "NEEDS_INFO" && <th className="px-4 py-3">Note</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((invoice) => (
                <tr key={invoice.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{invoice.vendorName}</td>
                  <td className="px-4 py-3">
                    {(invoice.amountCents / 100).toLocaleString(undefined, {
                      style: "currency",
                      currency: invoice.currency,
                    })}
                  </td>
                  <td className="px-4 py-3">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  {tab === "NEEDS_INFO" && <td className="px-4 py-3">{invoice.needsInfoNote || "-"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
