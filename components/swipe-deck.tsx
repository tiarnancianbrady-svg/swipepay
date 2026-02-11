"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TinderCard from "react-tinder-card";
import * as Dialog from "@radix-ui/react-dialog";
import { VendorLogo } from "@/components/vendor-logo";

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
};

export function SwipeDeck({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);

  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);
  const [leftInvoiceId, setLeftInvoiceId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const topInvoice = useMemo(() => invoices[0], [invoices]);
  const cardRefs = useRef<any[]>([]);

  async function performSwipeRight(id: string) {
    await fetch(`/api/invoices/${id}/swipe-right`, { method: "POST" });
    setInvoices((current) => current.filter((invoice) => invoice.id !== id));
  }

  function openLeftModal(id: string) {
    setLeftInvoiceId(id);
  }

  async function submitLeft() {
    if (!leftInvoiceId || !note.trim()) return;
    await fetch(`/api/invoices/${leftInvoiceId}/swipe-left`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setInvoices((current) => current.filter((invoice) => invoice.id !== leftInvoiceId));
    setLeftInvoiceId(null);
    setNote("");
  }

  if (!topInvoice) {
    return <p className="rounded-lg bg-white p-8 text-center text-slate-500">Inbox clear 🎉</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[420px] w-full max-w-md">
        {invoices.map((invoice, index) => (
          <TinderCard
            key={invoice.id}
            className="absolute"
            ref={(el) => (cardRefs.current[index] = el)}
            onSwipe={(direction) => {
              if (direction === "right") void performSwipeRight(invoice.id);
              if (direction === "left") openLeftModal(invoice.id);
            }}
            preventSwipe={["up", "down"]}
          >
            <div className="flex h-[400px] w-[340px] flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <VendorLogo vendorName={invoice.vendorName} logoUrl={invoice.logoUrl} />
                <div>
                  <p className="font-semibold">{invoice.vendorName}</p>
                  <p className="text-sm text-slate-500">
                    {invoice.frequency} ({Math.round(invoice.frequencyConfidence * 100)}%)
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold">
                {(invoice.amountCents / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: invoice.currency,
                })}
              </p>
              <p className="text-sm text-slate-700">{invoice.serviceDescription}</p>
              <a href={invoice.invoiceFileUrl} className="text-sm text-blue-600 underline" target="_blank">
                View invoice
              </a>
            </div>
          </TinderCard>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          className="rounded-md border border-red-400 px-4 py-2 text-red-600"
          onClick={() => topInvoice && openLeftModal(topInvoice.id)}
        >
          Needs Info
        </button>
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-white" onClick={() => topInvoice && void performSwipeRight(topInvoice.id)}>
          Approve
        </button>
      </div>

      <Dialog.Root open={Boolean(leftInvoiceId)} onOpenChange={(open) => !open && setLeftInvoiceId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6">
            <Dialog.Title className="text-lg font-semibold">Why does this need more info?</Dialog.Title>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-3 min-h-[120px] w-full rounded border p-2"
              placeholder="Required note"
            />
            <button className="mt-4 w-full rounded-md bg-slate-900 py-2 text-white disabled:bg-slate-400" onClick={submitLeft} disabled={!note.trim()}>
              Submit
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
