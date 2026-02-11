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

## Local setup (host-run app + dockerized Postgres)
This is the recommended local dev mode and matches the default `DATABASE_URL` in `.env.example`.

1. Start Postgres:
   ```bash
   docker compose up -d
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy env example to local env file:
   ```bash
   cp .env.example .env.local
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Apply schema in local dev:
   ```bash
   npm run prisma:push
   ```

6. Verify DB connectivity:
   ```bash
   npm run db:check
   ```

7. Run app:
   ```bash
   npm run dev
   ```

Open http://localhost:3000.

### Docker vs host `DATABASE_URL`
- **Host-run Next.js app (`npm run dev`)**: use `localhost:5432`.
- **Next.js inside docker-compose**: use `postgres:5432` (service name), not `localhost`.

`.env.example` includes both variants.

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

## OAuth troubleshooting (local development)
If Google sign-in redirects to `/api/auth/signin?error=OAuthSignin`, verify:
- `NEXTAUTH_URL` exactly matches your local origin (usually `http://localhost:3000`)
- Google OAuth **Authorized redirect URI** includes `http://localhost:3000/api/auth/callback/google`
- Google OAuth **Authorized JavaScript origins** includes `http://localhost:3000`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set and app server was restarted
- DB is reachable with `npm run db:check`

The sign-in page now shows missing environment variables directly to make setup issues easier to diagnose.

## Postgres troubleshooting
- Check container status:
  ```bash
  docker compose ps
  ```
- Check Postgres logs:
  ```bash
  docker compose logs postgres
  ```
- Confirm local port 5432 is listening:
  - macOS/Linux:
    ```bash
    lsof -i :5432
    ```
  - Windows (PowerShell):
    ```powershell
    netstat -ano | findstr :5432
    ```
- Re-run connectivity check:
  ```bash
  npm run db:check
  ```
