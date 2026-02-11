import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@swipepay.dev" },
    update: {},
    create: { email: "demo@swipepay.dev", name: "Demo User" },
  });

  const connection = await prisma.inboxConnection.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      provider: "google",
      apEmailAddress: "ap@company.com",
      accessToken: "demo-token",
      refreshToken: "demo-refresh",
    },
  });

  await prisma.invoice.createMany({
    data: [
      {
        connectionId: connection.id,
        vendorName: "Figma",
        vendorDomain: "figma.com",
        logoUrl: "https://logo.clearbit.com/figma.com",
        amountCents: 120000,
        currency: "USD",
        frequency: "MONTHLY",
        frequencyConfidence: 0.94,
        serviceDescription: "Design collaboration plan",
        invoiceNumber: "FG-2026-001",
        invoiceFileUrl: "https://example.com/figma.pdf",
        status: "INBOX",
      },
      {
        connectionId: connection.id,
        vendorName: "AWS",
        vendorDomain: "amazon.com",
        logoUrl: "https://logo.clearbit.com/amazon.com",
        amountCents: 455000,
        currency: "USD",
        frequency: "MONTHLY",
        frequencyConfidence: 0.81,
        serviceDescription: "Cloud hosting",
        invoiceNumber: "AWS-2026-02",
        invoiceFileUrl: "https://example.com/aws.pdf",
        status: "APPROVAL_QUEUE",
      },
      {
        connectionId: connection.id,
        vendorName: "Notion",
        vendorDomain: "notion.so",
        logoUrl: "https://logo.clearbit.com/notion.so",
        amountCents: 24000,
        currency: "USD",
        frequency: "ANNUAL",
        frequencyConfidence: 0.63,
        serviceDescription: "Workspace licenses",
        invoiceNumber: "NT-99331",
        invoiceFileUrl: "https://example.com/notion.pdf",
        status: "NEEDS_INFO",
        needsInfoNote: "Need PO number from requester",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
