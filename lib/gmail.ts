import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { extractInvoiceData, mapExtractionToInvoiceFields } from "@/lib/invoice-parsing";
import fs from "node:fs/promises";
import path from "node:path";

const INVOICE_KEYWORDS = ["invoice", "receipt", "billing", "statement"];

function isLikelyInvoice(subject: string, snippet: string, hasPdf: boolean): boolean {
  const text = `${subject} ${snippet}`.toLowerCase();
  const hasKeyword = INVOICE_KEYWORDS.some((keyword) => text.includes(keyword));
  const isNewsletter = text.includes("newsletter");
  return (hasPdf || hasKeyword) && !isNewsletter;
}

function getMessagePartFilename(part: any): string | null {
  if (part.filename) return part.filename;
  if (part.parts?.length) {
    for (const sub of part.parts) {
      const nested = getMessagePartFilename(sub);
      if (nested) return nested;
    }
  }
  return null;
}

function flattenParts(payload: any): any[] {
  if (!payload) return [];
  const result = [payload];
  if (payload.parts) {
    for (const part of payload.parts) {
      result.push(...flattenParts(part));
    }
  }
  return result;
}

async function downloadAttachment({
  gmail,
  userId,
  messageId,
  attachmentId,
  filename,
}: {
  gmail: any;
  userId: string;
  messageId: string;
  attachmentId: string;
  filename: string;
}) {
  const attachment = await gmail.users.messages.attachments.get({
    userId,
    messageId,
    id: attachmentId,
  });

  const data = attachment.data.data;
  if (!data) return null;

  const bytes = Buffer.from(data, "base64");
  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, safeFilename);
  await fs.writeFile(filePath, bytes);
  return { filePath, sizeBytes: bytes.length, storageUrl: safeFilename };
}

export async function syncGmailInbox(connectionId: string, days = 90) {
  const connection = await prisma.inboxConnection.findUnique({ where: { id: connectionId }, include: { user: true } });
  if (!connection?.accessToken) {
    throw new Error("Missing Gmail token");
  }

  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ access_token: connection.accessToken, refresh_token: connection.refreshToken || undefined });

  const gmail = google.gmail({ version: "v1", auth });
  const afterDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const query = `after:${Math.floor(afterDate.getTime() / 1000)}`;

  const listRes = await gmail.users.messages.list({ userId: "me", q: query, maxResults: 100 });
  const messages = listRes.data.messages || [];

  let ingested = 0;

  for (const msg of messages) {
    const existing = await prisma.emailMessage.findUnique({ where: { gmailMessageId: msg.id! } });
    if (existing) continue;

    const fullMessage = await gmail.users.messages.get({ userId: "me", id: msg.id!, format: "full" });
    const payload = fullMessage.data.payload;
    const headers = payload?.headers || [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "(No subject)";
    const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
    const snippet = fullMessage.data.snippet || "";
    const dateHeader = headers.find((h: any) => h.name === "Date")?.value;

    const parts = flattenParts(payload);
    const pdfPart = parts.find((p) => p.filename?.toLowerCase().endsWith(".pdf") && p.body?.attachmentId);
    const likelyInvoice = isLikelyInvoice(subject, snippet, Boolean(pdfPart));

    const email = await prisma.emailMessage.create({
      data: {
        connectionId: connection.id,
        gmailMessageId: msg.id!,
        threadId: fullMessage.data.threadId || msg.id!,
        from,
        subject,
        date: dateHeader ? new Date(dateHeader) : new Date(),
        snippet,
        rawLink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
      },
    });

    if (!likelyInvoice) continue;

    let fileUrl = email.rawLink || "";
    const attachments = [] as Array<{ filename: string; mimeType: string; sizeBytes: number; storageUrl: string }>;

    if (pdfPart?.body?.attachmentId) {
      const filename = getMessagePartFilename(pdfPart) || "invoice.pdf";
      const saved = await downloadAttachment({
        gmail,
        userId: "me",
        messageId: msg.id!,
        attachmentId: pdfPart.body.attachmentId,
        filename,
      });

      if (saved) {
        fileUrl = email.rawLink || "";
        attachments.push({ filename, mimeType: "application/pdf", sizeBytes: saved.sizeBytes, storageUrl: saved.storageUrl });
      }
    }

    const extraction = await extractInvoiceData(`${subject}\n${snippet}`);
    const mapped = mapExtractionToInvoiceFields(extraction);

    const invoice = await prisma.invoice.create({
      data: {
        connectionId: connection.id,
        emailMessageId: email.id,
        ...mapped,
        invoiceFileUrl: fileUrl,
        status: "INBOX",
      },
    });

    await prisma.actionLog.create({
      data: { invoiceId: invoice.id, userId: connection.userId, actionType: "INGESTED", note: "Email and invoice ingested." },
    });

    await prisma.actionLog.create({
      data: { invoiceId: invoice.id, userId: connection.userId, actionType: "PARSED", note: "AI extraction complete." },
    });

    if (attachments.length) {
      await prisma.invoiceAttachment.createMany({
        data: attachments.map((att) => ({ ...att, invoiceId: invoice.id })),
      });
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { invoiceFileUrl: `/api/invoices/${invoice.id}/file` },
      });
    }

    ingested += 1;
  }

  return { scanned: messages.length, ingested };
}
