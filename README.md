# Tradeintra — mock operator studio

**Build. Deploy. Trade.** A runnable template-first studio for branded Deriv-style sites. **Development/staging MVP, not a production trading service.**

## Try it

Requires Node.js **22.15+** (verified locally on 22.22.3) and npm:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` for the public site, or `http://localhost:3000/studio` for the operator studio. No paid service, API key, or external database is needed for local development. Fonts are bundled, and browser requests use relative API URLs.

You can use the two sample drafts in **anonymous demo mode**, or create an account for a separate, initially empty **server-backed development workspace**. Signup requires a full name, email, and a password with at least 8 characters, one uppercase letter, and one number. Local mode returns a development verification token; verifying awards 30 starter credits. Google sign-in uses a labelled mock identity locally until OAuth credentials are supplied. Do not use Deriv credentials or sensitive data. Accounts are limited to one active site; archive or delete before creating a replacement. Password recovery and real 2FA remain provider adapters.

### The completed local flow

1. Create an account or sign in.
2. Choose the curated Deriv Studio template.
3. Set a brand name, accent, headline, and description.
4. Select market-watchlist, mock-terminal, and about modules.
5. Choose a preview name; the server checks reservations across accounts.
6. Save a private draft or publish an immutable mock snapshot.
7. Open the snapshot at `/sites/your-slug` using **site actions → Open mock site**.
8. Edit drafts without changing the published site; publish a new version or restore an earlier version.
9. Change workspace/mock-link settings, export configuration, archive a site, or sign out and return later.

Published mock snapshots are visible to anyone who knows their URL. **Never publish personal or sensitive information.** Publishing does not configure `slug.tradeintra.com`, buy a domain, establish SSL, enable Deriv, or execute a trade. Tradeintra is independent of Deriv; all market prices/charts are explicitly illustrative. Risk disclosure cannot be removed.

## Implemented

- Responsive dashboard with real workspace counts and clearly labeled sample drafts.
- Five-step wizard, field validation, live brand preview, three configurable modules, desktop/mobile previews.
- Server registration/sign-in/out, salted scrypt password hashes, hashed random session tokens, HttpOnly/SameSite cookies, Secure cookies on HTTPS.
- Account-scoped SQL transactions and FORCE RLS; no client-supplied account ownership.
- Cross-account name reservations, private drafts, published-only public rendering, immutable snapshots and append-only restore.
- Atomic changes with revision conflicts and idempotent retry protection; duplicate-submit guards and bounded JSON input.
- Persistent auth/mutation rate limits, mock-only provider guards, redacted errors, export, and archive.
- Branded 404/error states, keyboard dialogs, contrast-safe accent text, responsive and automated accessibility checks.
- Separate opt-in cPanel POC harness for host/SQL/files/cron verification.
- Automated test suite and a GitHub Actions verification workflow (configured, not remotely executed in this session).

## Development-only mock operations

In `next dev`, the studio exposes browser-local mock workflows for domains, billing, credits, email/2FA, support tickets, bots, AI generation, signals, marketplace, earnings, announcements, custom hosts, jobs, storage, backups, audit, and account lifecycle. They call no external provider, are clearly labelled `DEVELOPMENT MOCK`, and are hidden in production builds unless `NEXT_PUBLIC_MOCK_OPS=true` is set explicitly. Mock state is stored in the browser, not in the account database.

## Storage modes and safety

| Mode                      | How enabled                                                                                                                  | Persistence / limitations                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous demo            | Always available at `/`                                                                                                      | `tradeintra-studio-v1` in this browser's localStorage; no authentication. Two editable sample drafts. Browser-only snapshots, not public URLs.                                          |
| Local account studio      | Default for `npm run dev`; or explicit `STUDIO_DB_MODE=local` and `STUDIO_ENV=local` for a built local server                | Private on-disk PostgreSQL-in-WASM (PGlite); one process with serialized connection leases. Accounts/sessions/configuration survive process restarts. Not a production database choice. |
| PostgreSQL staging studio | `STUDIO_DB_MODE=postgres`, `STUDIO_ENV=staging`, `STUDIO_ENABLED=true`, `APP_URL`, `DATABASE_URL`, and explicit schema setup | Uses `pg`/Kysely and a dedicated schema on an approved staging DB. No automatic hosted migration or silent local fallback. Actual Namecheap/PG 10/network/SSL limits remain unverified. |
| Production/built default  | `npm run build && npm start`, no studio mode configured                                                                      | Server accounts disabled; browser demo remains available. No production account mode has been approved.                                                                                 |

Local database directory defaults to `~/.local/share/tradeintra-studio`, outside the checkout, with directory mode `0700`. Override with an absolute private `STUDIO_DATA_DIR` **outside web roots**. Keep it out of Git and backups/screenshots shared publicly. Local development databases are not included in source snapshots; back them up privately if needed. Stop the application before moving or backing up a local database directory. Do not point two processes at the same PGlite directory. Anonymous demo JSON and authenticated account state remain separate; account data/tokens are never copied into demo localStorage.

Development safeguards: one active site per account and fifty snapshots per site; seven-day sessions; five retained sign-ins. Archiving removes a site's public URL and releases reservations while retaining immutable history privately. Full account erasure/retention automation and JSON import are not implemented. Export contains configuration, not credentials or session tokens.

This is not independently audited or approved for real customer/financial data. Use only synthetic data. Production requires verified email/recovery/2FA, authorization and abuse review, legal/retention work, and the actual hosting POC.

## Build and verify

```sh
npm run format:check
npm run typecheck
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
npm audit
```

For an already installed compatible Chromium, set `CHROMIUM_PATH`. Sandbox verification used a temporary compatible npm-distributed Chromium because the standard browser CDN was network-blocked; no alternate browser package is a committed runtime dependency.

To run the **built source-checkout** local account MVP (with dev dependencies installed for PGlite):

```sh
npm run build
STUDIO_DB_MODE=local STUDIO_ENV=local npm run start:cpanel
```

`server.cjs` (source install) binds to `0.0.0.0`, honors `PORT`, serves the production Next.js build, and closes the local DB gracefully on shutdown. The standalone release uses `cpanel-start.js`, pins the bind host, and refuses local PGlite mode. Passenger compatibility still requires actual cPanel testing. There has been no public/paid infrastructure deployment.

## Staging setup is explicit

Follow [the cPanel POC runbook](Tradeintra_Documentation_Pack/docs/cpanel-poc-runbook.md) and [MVP delivery record](Tradeintra_Documentation_Pack/docs/mvp-delivery.md). Set real variables through a secure environment, never chat or Git. `.env.example` contains placeholders only.

- `npm run poc:migrate -- --apply` / `poc:seed -- --apply` operate on **diagnostic fixtures** in `tradeintra_poc` only.
- `npm run poc:check -- --probe`, `poc:cron`, and `poc:smoke` exercise diagnostic boundaries. They do not certify actual DNS/SSL or scheduler/resource behavior.
- `npm run studio:migrate -- --apply` reads an optional ignored `.env.studio` and explicitly applies `database/002-studio.sql` to the **dedicated staging studio DB**. It requires the staging mode flags. No hosted schema is created at startup, build, or request time.
- `POC_ENABLED` and `POC_HOSTS` are solely for the three seeded diagnostic tenant hosts. They do not publish account sites or enable the studio backend.
- `/api/health` is redacted **liveness**, not database/SSL readiness. It distinguishes anonymous demo persistence from account mode.

The confirmed production target remains one Node.js runtime on Namecheap Stellar Plus/cPanel with PostgreSQL, private local files, and cron. No new hosting, database service, CDN, or paid provider is required. Local PGlite is a development aid, **not** a replacement for that hosting decision or PG 10 compatibility evidence.

## Main files

- `app/page.tsx`, `app/globals.css` — studio, wizard, responsive design.
- `lib/use-server-workspace.ts` — authenticated client coordination, conflict/retry/session handling.
- `lib/server/studio/` — auth, strict schemas, origin/body guards, DB adapters, scoped service operations.
- `app/api/studio/[...path]/route.ts` — same-origin account/session/action API.
- `app/sites/[slug]/`, `app/sites/by-host/`, `components/published-site.tsx` — public **mock published-only** renderers for free subdomains and custom hosts.
- `database/002-studio.sql`, `003-slug-hardening.sql`, `005-host-mappings.sql`, `006-host-mapping-canonical.sql`, `007-host-mapping-rls.sql` — local/staging studio schema, slug hardening, custom-host routing, and immutability constraints.
- `database/001-poc.sql`, `lib/server/poc-*`, `scripts/poc-*`, `proxy.ts` — separate diagnostic POC harness.
- `tests/` — unit, SQL, filesystem, HTTP-security, and browser verification.
- `Tradeintra_Documentation_Pack/` — requirements, confirmed decisions, evidence, and outstanding release gates.

## Explicitly unavailable

Real Namecheap deployment, domain purchase/DNS/SSL, Deriv OAuth/trading, payments/earnings, email verification/recovery, 2FA, customer asset uploads/scanning, bot/AI/signal/marketplace operations, production billing/plan enforcement, admin/team RBAC, and permanent account erasure. The UI does not pretend these work. Read the delivery record for the production gate; this repository is not a production-release sign-off.
