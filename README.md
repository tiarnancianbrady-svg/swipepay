# SwipePay MVP

SwipePay is a Next.js 14 monorepo MVP for AP inbox triage. It connects a Gmail inbox, ingests invoice-like emails, parses invoice metadata with OpenAI, and lets users swipe invoices into queues.

## Stack
- Next.js 14 App Router + TypeScript + Tailwind
- Prisma + Postgres
- NextAuth (Google OAuth)
- Gmail API
- OpenAI API (JSON extraction)
- Local upload storage for attachments (`uploads/` served via secure API route)

## Features
- Google sign-in with least-privilege Gmail read-only scope
- Inbox sync (`POST /api/sync`) with idempotent Gmail ingestion by `gmailMessageId`
- Invoice candidate detection via PDF attachment + keyword heuristic
- AI extraction + fallback regex parsing
- Swipe deck (left/right gestures + desktop buttons)
- Queues:
  - Inbox (swipe)
  - Approval Queue
  - Needs More Info (with required note)
- Action logging (`INGESTED`, `PARSED`, `SWIPE_RIGHT`, `SWIPE_LEFT`)

## Local setup
1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. Start Postgres:
   ```bash
   docker compose up -d
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma client and run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed sample data:
   ```bash
   npm run prisma:seed
   ```
6. Run app:
   ```bash
   npm run dev
   ```

Open http://localhost:3000.

## Required env vars
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`

## API endpoints
- `GET /api/invoices?status=INBOX|APPROVAL_QUEUE|NEEDS_INFO`
- `POST /api/sync`
- `POST /api/invoices/:id/swipe-right`
- `POST /api/invoices/:id/swipe-left` (requires `{ note }`)
- `GET /api/invoices/:id/file`

## Testing
```bash
npm run test
```

Includes:
- unit test for extraction mapping + amount cents conversion
- action logic tests for swipe-left note validation and status transitions

## Security/privacy notes
- Gmail scope is read-only
- Only snippet is stored (not full raw email body)
- Attachment files are private and served by authenticated API route
- Action logs track invoice state changes

## Demo flow without Gmail
- Run seed script to create mock invoices
- Sign in with a Google account after configuring OAuth
- Open dashboard and triage seeded Inbox invoices via swipe/buttons
