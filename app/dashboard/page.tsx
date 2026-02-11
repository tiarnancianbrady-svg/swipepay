import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";
import { CreditCard } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const connection = await prisma.inboxConnection.findFirst({ where: { userId: session.user.id } });
  if (!connection) {
    redirect("/signin");
  }

  const inboxInvoices = await prisma.invoice.findMany({
    where: { connectionId: connection.id, status: "INBOX" },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-fuchsia-50">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-8 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                <CreditCard size={14} /> SwipePay
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Invoice Inbox</h1>
              <p className="mt-1 text-slate-600">Connected inbox: {connection.apEmailAddress}</p>
            </div>
            <a
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100"
              href="/api/auth/signout"
            >
              Sign out
            </a>
          </div>
        </header>

        <DashboardClient seedInvoices={inboxInvoices} />
      </div>
    </main>
  );
}
