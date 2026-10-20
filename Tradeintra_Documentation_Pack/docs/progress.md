# Tradeintra Progress Log

Keep this file factual and current. Do not mark work complete without evidence.

## Current phase

**Phase 0 complete. Phase 1 local studio prototype implemented; production hosting POC blocked/unverified.**

## Completed

- Owner selected domain `https://Tradeintra.com`.
- Brand colors agreed: `#FEDD00`, `#0D000A`, `#F3F2F2`.
- Lowercase `tradeintra` wordmark and custom lowercase `t` direction explored.
- Tagline: `Build. Deploy. Trade.`
- DForge public pages, authenticated dashboard, settings, AI tools, domains, deployments, commissions, earnings, support, and tutorials inspected.
- DForge terms/privacy/developer/MCP surface reviewed.
- Deriv REST/WebSocket/OAuth/limits/markup/partner/payment-agent docs reviewed.
- Deriv bot/SmartTrader repositories reviewed.
- Deriv-only product direction confirmed.
- Namecheap Stellar Plus/cPanel hosting confirmed.
- Namecheap Registrar API direction confirmed (manual fallback).
- Template + brand kit + modules confirmed (no free-form builder).
- Free subdomain policy confirmed.
- Domain pricing model confirmed.
- Payment-agent functionality deferred.
- Mock Deriv integration confirmed.
- Documentation pack updated.
- Gap register created (`docs/gaps-and-open-items.md`) with 123 items and status tracking.
- Brand logo and favicon added to `brand/`.
- Logo and favicon SVG colors normalized to `#FEDD00` / `#0D000A`.

## Not yet completed

- Production account/authentication and tenant-scoped data implementation.
- POC: cPanel Node.js deployment of Tradeintra itself.
- POC: wildcard subdomain routing + SSL.
- POC: multiple tenant configs through the shared runtime.
- POC: custom domain + SSL.
- POC: tenant isolation, PostgreSQL compatibility, file limits, cron jobs.
- POC: mock Deriv auth.
- POC: Namecheap domain search/price/purchase test flow or manual fallback.
- Live Deriv account, partner/OAuth access, and integration.
- Domain markup/ownership legal review.
- Plan pricing and entitlements.
- Payment provider integration.
- Marketplace/signals phases.

## Current blockers / unknowns

- No Deriv account or approved partner/OAuth access.
- Namecheap markup/resale terms and registrant ownership need legal review.
- Namecheap API production access/IP whitelisting is unconfirmed.
- Wildcard SSL, cPanel automation, PostgreSQL 10.23, and shared-hosting limits are unverified.
- The application is a browser-local POC only, not a production backend.
- POC has not validated the architecture.

## Next action

Deploy Tradeintra itself to Stellar Plus, prove wildcard routing/SSL, publish several tenant configurations through the shared runtime, verify PostgreSQL/file/cron limits, and exercise mock Deriv mode. Do not start live integration or payment-agent work.

## 2026-10-20 — Local studio implementation

- Inspected documentation-only repository and available Node 22.22.3 runtime.
- Built the Next.js/React/TypeScript mock studio and five-step site wizard.
- Added draft management, safe local subdomain validation, browser persistence, module-aware previews, immutable local publish history and restore.
- Added workspace settings, mock Deriv linking, data export/reset, transparent DNS/SSL status, help, and deferred-feature screens.
- Preserved production boundaries: no real Deriv, hosting deployment, domains, funds, or payments.
- Verified 11 unit tests and 4 browser tests, including key journeys, five responsive widths, and automated accessibility checks on seven screens plus all wizard steps.
- Typecheck and production build passed. Final format/build/audit verification is recorded below.
- See `local-poc-report.md` for scope, evidence, and remaining acceptance criteria.

**Next:** obtain owner-approved cPanel test access through a secure channel; execute the mandatory hosting POC. Do not interpret local snapshots as real site deployment.

### Final local verification — 2026-10-20

- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm test` — 11/11 passed.
- `npm run test:e2e` (compatible Chromium override) — 4/4 passed.
- `npm run build` — passed.
- `npm audit` — 0 vulnerabilities reported.
- `git diff --check` — passed.
- Local development preview running on port 3000; no production deployment performed.

## 2026-10-20 — Staging POC harness preparation

- Added a built Node startup file (`server.cjs`) and redacted `/api/health` liveness route.
- Added opt-in exact-host routing and server-rendered pages for three explicitly seeded mock tenants. Public reads require matching environment/DB host mappings and load published snapshots only; no draft fallback.
- Added a separate `tradeintra_poc` SQL schema with FORCE RLS, pg/Kysely scoped transactions, immutable DB versions, a session-query probe, and harmless DB cron jobs. This is not customer authentication or the final production data model.
- Added explicit migration/seed/diagnostic/cron commands, a private bounded file probe store, `.env.example`, and `cpanel-poc-runbook.md`. Commands do not run automatically or call live providers.
- Local model/SQL/filesystem/routing verification: 39 tests passed, including PostgreSQL-in-WASM RLS tests on a newer engine. This does not establish real pg driver/PG 10/cPanel compatibility.
- Built-server local HTTP smoke checks passed for liveness, host rewrite, cross-tenant rejection, no forwarded-host selection, missing-DB failure without draft fallback, and control-plane availability. No successful hosted DB/SSL check was possible.
- Host deployment, DNS/SSL, credentials, cron scheduler, quotas, restart and rollback remain unverified. No external/paid infrastructure or DNS was changed.

**Next gate:** owner-approved cPanel staging environment and securely configured variables; execute the runbook and record actual evidence. Full implementation remains gated on that result.

### Staging harness final local verification — 2026-10-20

- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm test` — 39/39 passed, including dev-only PGlite SQL integration checks.
- `npm run test:e2e` (compatible Chromium override) — 5/5 passed; includes existing responsive/accessibility journeys and new liveness/disabled-route checks.
- `npm run build` — passed with `/api/health`, dynamic POC tenant route, and hostname proxy.
- `npm run poc:smoke -- http://127.0.0.1:3001` against the built Node startup — all six local assertions passed. Temporary test server stopped afterward; studio preview remains running on port 3000.
- `npm audit` — 0 vulnerabilities reported.
- `git diff --check` — passed.
- Actual host deployment, successful networked PostgreSQL render, PG 10.23, DNS/SSL, cPanel cron and resource gates remain unverified. No cPanel/database credentials or approved staging hosts were available in this environment.

## 2026-10-20 — Completed runnable local mock MVP

- Added server-backed development registration/sign-in/out, salted scrypt hashes, hashed expiring sessions, HTTPS Secure + HttpOnly/Lax cookies, strict same-origin bounded JSON APIs, and persistent rate limits. Email verification/recovery/2FA remain unavailable and visibly labeled.
- Added `tradeintra_studio` schema with FORCE RLS, scoped transactions, private drafts, global preview-name reservations, immutable snapshots, optimistic revisions/idempotent retries, archive, and published-only `/sites/slug` rendering.
- Connected the existing studio to account API actions while preserving a separate anonymous demo. Server account data/tokens never enter localStorage; a regression test covers expired-session refresh privacy.
- Added a private on-disk local development DB adapter with serialized transaction leases. PostgreSQL staging remains explicit and has no silent local fallback or automatic hosted migration. The approved production hosting decision is unchanged.
- Full browser account → brand/modules → mock URL → private edit → republish → restore → sign out/in flow passed, including mobile wizard and cross-account API denial.
- Built Node server registration, disk persistence, public snapshot rendering, and login/render after a real process stop/restart were executed successfully with isolated synthetic data. The temporary verification server was stopped.
- Added a configured-only CI workflow and `mvp-delivery.md`. No remote action, paid service, deployment, or DNS change was performed.
- Core local MVP is delivered; real hosting/provider and production/security/compliance acceptance is NOT complete.

### Final local MVP verification — 2026-10-20

- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm test` — 59/59 passed across model, SQL/service, auth, filesystem, host routing, origin, input, limits, and concurrency tests.
- `npm run test:e2e` (compatible Chromium override) — 8/8 passed; includes full authenticated publication/restore, cross-account denial, expired-session privacy regression, mobile account/wizard, public renderer accessibility, and previous demo journeys.
- `npm run build` — passed cleanly; private runtime filesystem access excluded from build tracing to prevent deployment bundling of runtime data.
- Built Node runtime account/save/publish survived actual process stop/restart and subsequent sign-in/public rendering. Only an isolated synthetic verification database was used and removed afterward.
- `npm audit` — 0 vulnerabilities reported.
- `git diff --check` — passed.
- The main development preview remains running on port 3000; temporary verification servers were stopped.
- CI workflow is configured but not remotely executed. No GitHub push/deployment, real cPanel test, DNS change, paid resource, real account-provider call, or financial operation occurred.

**Delivered:** the runnable local mock MVP documented in `mvp-delivery.md`. **Not delivered/certified:** the complete production PRD, real hosting/provider acceptance, verified email/recovery/2FA, full asset/brand controls, legal/retention/security operations, or a production launch. These remain explicit gates, not hidden working features.
