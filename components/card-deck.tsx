"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { InvoiceCard } from "@/components/invoice-card";

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

const STACK_DEPTH = 3;
const SWIPE_THRESHOLD = 120;

type SwipeDirection = "left" | "right";

export function CardDeck({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [leftInvoiceId, setLeftInvoiceId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeOut, setSwipeOut] = useState<SwipeDirection | null>(null);
  const dragStartRef = useRef<number | null>(null);

  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  const topInvoice = useMemo(() => invoices[0], [invoices]);
  const visibleStack = useMemo(() => invoices.slice(0, STACK_DEPTH), [invoices]);
  const swipeHint = dragX > 36 ? "right" : dragX < -36 ? "left" : null;

  const performSwipeRight = useCallback(async (id: string) => {
    await fetch(`/api/invoices/${id}/swipe-right`, { method: "POST" });
    setInvoices((current) => current.filter((invoice) => invoice.id !== id));
  }, []);

  const openLeftModal = useCallback((id: string) => {
    setLeftInvoiceId(id);
  }, []);

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

  const resetDrag = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
    setDragX(0);
    setSwipeOut(null);
  }, []);

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!topInvoice) return;
      setIsDragging(false);
      setSwipeOut(direction);
      setTimeout(() => {
        if (direction === "right") {
          void performSwipeRight(topInvoice.id);
        } else {
          openLeftModal(topInvoice.id);
        }
        resetDrag();
      }, 180);
    },
    [openLeftModal, performSwipeRight, resetDrag, topInvoice],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!topInvoice) return;
    dragStartRef.current = event.clientX;
    setIsDragging(true);
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || dragStartRef.current === null) return;
    setDragX(event.clientX - dragStartRef.current);
  }

  function onPointerUp() {
    if (!isDragging) return;
    if (dragX > SWIPE_THRESHOLD) {
      triggerSwipe("right");
      return;
    }
    if (dragX < -SWIPE_THRESHOLD) {
      triggerSwipe("left");
      return;
    }
    resetDrag();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!topInvoice) return;
      if (event.key === "Enter" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        triggerSwipe("right");
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        triggerSwipe("left");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [topInvoice, triggerSwipe]);

  if (!topInvoice) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/90 p-12 text-center shadow-lg backdrop-blur">
        <p className="text-2xl font-semibold text-slate-700">Inbox clear 🎉</p>
        <p className="mt-2 text-slate-500">You&apos;re all caught up for now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative mx-auto flex h-[85vh] min-h-[620px] max-h-[860px] w-full items-center justify-center">
        {[...visibleStack].reverse().map((invoice, reverseIndex) => {
          const index = visibleStack.length - 1 - reverseIndex;
          const isTop = index === 0;
          const depth = index;

          const baseX = swipeOut === "right" ? 1000 : swipeOut === "left" ? -1000 : dragX;
          const rotation = Math.max(-10, Math.min(10, baseX / 25));

          return (
            <div key={invoice.id} className="absolute">
              <div
                role={isTop ? "button" : undefined}
                tabIndex={isTop ? 0 : -1}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? resetDrag : undefined}
                style={{
                  transform: isTop
                    ? `translateX(${baseX}px) rotate(${rotation}deg)`
                    : `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
                  opacity: 1 - depth * 0.15,
                  pointerEvents: isTop ? "auto" : "none",
                  transition: isDragging ? "none" : "transform 180ms ease-out, opacity 180ms ease-out",
                  touchAction: "none",
                }}
                aria-label={isTop ? `Invoice card for ${invoice.vendorName}` : undefined}
              >
                <InvoiceCard invoice={invoice} swipeHint={isTop ? swipeHint : null} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">
        <button
          className="flex-1 rounded-xl border border-rose-300 bg-white/90 px-6 py-4 text-base font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
          onClick={() => triggerSwipe("left")}
          aria-label="Mark invoice as needs info"
        >
          Needs Info (N)
        </button>
        <button
          className="flex-1 rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-md transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          onClick={() => triggerSwipe("right")}
          aria-label="Approve invoice"
        >
          Approve (A / Enter)
        </button>
      </div>

      <Dialog.Root open={Boolean(leftInvoiceId)} onOpenChange={(open) => !open && setLeftInvoiceId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/50 bg-white p-6 shadow-2xl">
            <Dialog.Title className="text-xl font-semibold text-slate-900">Why does this need more info?</Dialog.Title>
            <p className="mt-1 text-sm text-slate-500">Required note for the AP team.</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-4 min-h-[140px] w-full rounded-xl border border-slate-300 p-3 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Required note"
            />
            <button
              className="mt-4 w-full rounded-xl bg-slate-900 py-3 font-semibold text-white disabled:bg-slate-400"
              onClick={submitLeft}
              disabled={!note.trim()}
            >
              Submit
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
