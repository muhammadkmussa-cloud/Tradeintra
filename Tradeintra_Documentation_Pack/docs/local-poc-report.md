# Local studio POC — 2026-10-20

## Status

**Local UI/configuration prototype implemented. Production hosting POC NOT PASSED.**

Repository inventory found only the documentation pack and brand SVGs. No runtime, database, credentials, deployment files, or tests existed. The available sandbox runs Node 22.22.3. No cPanel access or PostgreSQL instance was supplied; no production/provider operation was attempted.

This slice is deliberately browser-local, not the full account → server tenant → real subdomain deployment slice. It validates the product interaction and immutable configuration model without claiming the proposed production architecture has been proven.

## Implemented scope

- Next.js/React/TypeScript studio using approved yellow/purple/white branding and supplied favicon.
- Dashboard statistics calculated from local state, with two labeled sample drafts and zero initial publishes/domains. No revenue, traffic, or customer metrics are fabricated.
- One curated Deriv template; five-step creation with validation; name, accent, headline, description; three module toggles; reserved/unique local slug validation.
- Browser persistence; sample editing; draft saving; filtering/search; confirmed deletion.
- Mock/local publishing: deep-copied immutable configuration snapshots, history, version preview, append-only restore.
- Desktop/mobile full preview respects module choices and retains mandatory risk copy.
- Mock account-link state with no real account access; workspace settings, export/reset; storage errors surfaced without overwriting unreadable data.
- Domains report DNS/SSL as unverified. Deferred tools explain their unavailable status rather than pretending to generate bots, signals, earnings, or paid operations.
- Self-hosted font, no required external runtime provider, no secrets.

## Local verification evidence

Executed in this session:

- `npm run typecheck` — passed.
- `npm run build` — passed (Next.js production build).
- `npm test` — 11 model tests passed.
- `npm run test:e2e` using the `CHROMIUM_PATH` override — browser journey results recorded in progress log.
- Responsive horizontal-overflow assertions at 360, 390, 768, 1024, and 1440 pixels; desktop/mobile screenshots inspected.
- Automated axe WCAG A/AA checks on Overview, Sites, Templates, Domains, Publish status, Settings, Support, and all five wizard steps. This is not a complete manual accessibility audit.
- Dependency audit performed; see progress log for final counts.

Chromium's standard CDN download was network-blocked. A temporary npm-distributed Chromium binary plus its matching libraries was used to execute tests; neither is a runtime or committed dependency.

## Explicitly incomplete acceptance criteria

- Real registration, verification, email, sessions, 2FA, RBAC, and tenant authorization.
- PostgreSQL/Kysely, RLS, migrations, job queue, cron, backup/restore.
- Server-side validation/entitlements and publication transactions.
- Hostname tenant routing, public published configuration, wildcard/custom DNS and SSL.
- Logo/favicon upload validation, isolation, scanning, cropping, and retention.
- Typography presets and contact/social configuration.
- Real Deriv OAuth/partner integration, registrar, billing, SMTP, and payments.
- Provider contracts, legal review, support operations, hosting limits, and production monitoring.

No authentication or tenant isolation claim is made for localStorage. Do not place sensitive information in this demo. The host POC and production checklist remain open.

## Later implementation update — staging preparation

A disabled-by-default cPanel/SQL/host/files/cron harness has since been added; see `cpanel-poc-runbook.md` and the latest `progress.md` entry. The original browser-local scope above is unchanged. The new harness uses separate seeded DB fixtures, not studio/customer data. Local tests have expanded, but actual host and production acceptance are still open.
