import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard-client";
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
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SwipePay Dashboard</h1>
          <p className="text-slate-600">Connected inbox: {connection.apEmailAddress}</p>
        </div>
        <a className="rounded-md border px-3 py-2" href="/api/auth/signout">
          Sign out
        </a>
      </header>

      <DashboardClient seedInvoices={inboxInvoices} />
    </main>
  );
}
