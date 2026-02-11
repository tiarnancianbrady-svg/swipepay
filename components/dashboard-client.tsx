"use client";

import { useEffect, useMemo, useState } from "react";
import { SwipeDeck } from "@/components/swipe-deck";

type Invoice = {
  id: string;
  vendorName: string;
  logoUrl: string | null;
  amountCents: number;
  currency: string;
  frequency: string;
  frequencyConfidence: number;
  serviceDescription: string;
  invoiceFileUrl: string;
  needsInfoNote?: string | null;
  createdAt: string;
};

export function DashboardClient({ seedInvoices }: { seedInvoices: Invoice[] }) {
  const [tab, setTab] = useState<"INBOX" | "APPROVAL_QUEUE" | "NEEDS_INFO">("INBOX");
  const [invoices, setInvoices] = useState<Invoice[]>(seedInvoices);

  async function load(status: typeof tab) {
    const response = await fetch(`/api/invoices?status=${status}`);
    const data = await response.json();
    setInvoices(data.invoices || []);
  }

  useEffect(() => {
    void load(tab);
  }, [tab]);

  const sorted = useMemo(
    () => [...invoices].sort((a, b) => b.amountCents - a.amountCents || +new Date(b.createdAt) - +new Date(a.createdAt)),
    [invoices],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[
          ["INBOX", "Inbox"],
          ["APPROVAL_QUEUE", "Approval Queue"],
          ["NEEDS_INFO", "Needs More Info"],
        ].map(([status, label]) => (
          <button
            key={status}
            className={`rounded-md px-4 py-2 ${tab === status ? "bg-slate-900 text-white" : "bg-white"}`}
            onClick={() => setTab(status as typeof tab)}
          >
            {label}
          </button>
        ))}

        <button
          className="ml-auto rounded-md bg-blue-600 px-4 py-2 text-white"
          onClick={async () => {
            await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: 90 }) });
            await load(tab);
          }}
        >
          Sync inbox
        </button>
      </div>

      {tab === "INBOX" ? (
        <SwipeDeck initialInvoices={invoices} />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                {tab === "NEEDS_INFO" && <th className="px-4 py-3">Note</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="px-4 py-3">{invoice.vendorName}</td>
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
