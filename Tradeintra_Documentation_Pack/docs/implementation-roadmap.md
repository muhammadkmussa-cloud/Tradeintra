# Implementation Roadmap

**Current status:** Discovery and hosting direction complete. POC not started. Do not mark a phase complete without evidence from the actual Stellar Plus account.

## Phase 0 — Discovery and hosting direction (complete)

- DForge reference analysis.
- Deriv API research.
- Owner decisions: Deriv-only, Namecheap Stellar Plus/cPanel only, Namecheap Registrar, template+modules, free subdomain, domain markup, payment-agent deferral, mock Deriv.
- Documentation updated for shared hosting.

Exit criteria: owner approves the revised direction. **Met.**

## Phase 1 — Stellar Plus baseline (next)

- Create staging on Stellar Plus.
- Configure cPanel Node.js app, supported Node version, app root, startup file, env vars.
- Create PostgreSQL database and test connection.
- Deploy a minimal Next.js health app.
- Verify restart and basic logging.

Exit: app runs on Stellar Plus; health endpoint responds; DB connects.

## Phase 2 — Real Next.js deployment

- Build with standalone output or equivalent.
- Upload a versioned release.
- Start via cPanel Node.js app.
- Run a migration.
- Test release upload, restart, and rollback folder.
- Verify resource usage during build/run.

Exit: Tradeintra itself runs on Stellar Plus.

## Phase 3 — Routing, wildcard, and SSL

- Configure `*.tradeintra.com` wildcard subdomain.
- Verify wildcard traffic reaches the Node app.
- Test AutoSSL; if unavailable, install a wildcard certificate.
- Publish three differently configured demo tenants.
- Test custom domain addon + SSL.

Exit: multiple subdomains and one custom domain serve different configs over HTTPS.

## Phase 4 — Auth and tenant isolation

- Auth.js, DB sessions, signup/login/verify/2FA/recovery.
- PostgreSQL RLS and scoped queries.
- Tenant isolation for data, files, routes, and jobs.
- Cross-tenant tests.

Exit: Tenant A cannot read or modify Tenant B.

## Phase 5 — Module builder and publish

- Deriv trading template.
- Brand kit.
- Module registry/compatibility.
- Draft, validate, preview, publish, rollback to prior config.
- Shared-runtime hostname resolver.
- Free subdomain flow.

Exit: create → brand → modules → subdomain → publish works end to end.

## Phase 6 — Local storage

- `storage/{account_id}/...` outside web root.
- Upload limits, disk/inode quotas, signed download route.
- Backup inclusion and cleanup.

Exit: uploads work within measured limits; no cross-tenant access.

## Phase 7 — Jobs and cron

- DB-backed job queue.
- Protected cron tick every 5 minutes.
- Idempotency, retries, timeouts, stuck-job detection.
- Use for domain polling, email, renewals, cleanup.

Exit: jobs run reliably via cron; no persistent worker.

## Phase 8 — Domains and SSL

- Namecheap API adapter, sandbox first.
- Search/availability/price.
- Price table fallback; markup; last-verified timestamp.
- Purchase/renewal/transfer/contact.
- Manual fallback.
- cPanel addon domain, DNS, SSL.
- Price-change customer confirmation.

Exit: one sandbox/manual domain flow works end to end, with failure/refund handling.

## Phase 9 — Billing and email

- Paystack + M-Pesa sandbox.
- cPanel SMTP + EmailProvider interface.
- Subscription/domain/credit orders.
- Invoices/receipts.

Exit: payment → entitlement/order flow works; email sends.

## Phase 10 — Bots and optional AI assistance

- XML upload/validation/scan.
- Bot library/assignment.
- Optional AI generation as a bounded job, if hosting limits allow.
- Compatibility labels.

Exit: safe bot upload/generation and site assignment within shared-hosting limits.

## Phase 11 — Hardening and release

- Measure CPU, memory, inodes, cron runtime, request latency.
- Backup/restore test.
- Security review.
- Monitoring/alerts.
- Support/runbooks.
- Release checklist.
- Document practical tenant limit.

Exit: measured limits and release checklist resolved or risks accepted.

## Phase 12 — Live Deriv (gated)

- Deriv account/partner/OAuth.
- Server-side token exchange.
- WebSocket OTP.
- Rate limits/reconnect.
- Markup/commission disclosure.
- Legal/compliance review.

Exit: live checklist passes and owner approves.

## Deferred phases

- AI Builder arbitrary generated apps.
- Marketplace/bot store.
- Advanced signal automation.
- Payment-agent functionality.
- Multi-broker support.

## Per-phase process

Plan → implement a small slice → test on Stellar Plus → review → document → owner demo/approval → proceed.

## Explicit non-goals until approved

- Payment-agent functionality / 22% share.
- Multi-broker support.
- Free-form page builder.
- Arbitrary code in curated sites.
- Per-customer Node process.
- Redis/VPS/Vercel/Neon dependency.
- Live trading without approval.
