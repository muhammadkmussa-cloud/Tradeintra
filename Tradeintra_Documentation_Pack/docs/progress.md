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

## 2026-10-20 — Premium control plane and Namecheap runtime pass

- Reworked the control plane into the "Obsidian Ledger" direction: self-hosted Source Serif 4, Hanken Grotesk, and IBM Plex Mono; warm paper, ink structure, bullion accent; removed pastel/sparkle decoration; updated copy and tenant accents.
- Rebuilt the overview, sites, templates, domains, launch ledger, settings, support, auth, wizard, preview, and responsive states with verified axe/contrast and 8/8 Playwright journeys.
- Added a standalone cPanel release (`npm run package:cpanel`) with a 24 MB traced runtime, no symlinks, a guarded `cpanel-start.js`, a minimal release manifest, and `docs/cpanel-deploy.md`.
- Added production-style tenant host routing: `TENANT_HOST_SUFFIX` free subdomains, `TENANT_CUSTOM_HOSTS` custom domains through active `host_mappings`, fail-closed unknown/malformed hosts, and tenant/API path isolation.
- Hardened slugs across client, server, and database; preserved legacy reads while rejecting new consecutive-hyphen and reserved names; added RLS for custom-host mappings and account-scoped archive behavior.
- Added `003`, `004`, `005`, `006`, and `007` migrations plus migration-runner coverage; typecheck, 67 unit tests, build, format, audit, and 8/8 e2e passed locally.
- Actual Stellar Plus/Passenger startup, PostgreSQL 10, DNS/SSL, cron, and Namecheap API access remain unverified gates.

## 2026-10-20 — Development-only mock operations

- Added browser-local mock workflows for domain search/buy/connect/verify/renew/remove, custom host mapping, plans/subscription/credits, support tickets, XML bots, AI bot generation, AI signals, marketplace purchases, earnings/payouts, announcements, admin markup/jobs/audit, storage assets, backups, email verification/reset, mock 2FA, account-deletion grace, and account/mock export.
- Every surface is labelled `DEVELOPMENT MOCK`, makes no external provider call, and is hidden from the production UI unless `NEXT_PUBLIC_MOCK_OPS=true` is set at build time. The mock component is dynamically imported.
- Added defensive localStorage handling, canonical hostname validation, domain-price consistency, duplicate-purchase guards, negative-amount clamps, signal/ticket transition guards, and account-scoped duplicate checks.
- Added 6 mock-state unit tests and 2 Playwright journey tests; expanded axe coverage to Billing, Admin, XML Bots, AI Bot Generator, AI Signals, Marketplace, Earnings, Announcements, Support, and Settings.
- Local verification: 73 unit tests, 10/10 Playwright tests, typecheck, build, format, audit, standalone packaging with no symlinks. Real providers and host gates remain unverified.

## 2026-10-20 — Public site, identity, referral, and Deriv gate

- Split the public marketing surface at `/` from the operator studio at `/studio`; added `/login`, `/signup`, `/contact`, `/developers`, `/mcp`, `/terms`, and `/privacy`.
- Added email/password signup with full name, referral code, 8+ character password requiring an uppercase letter and a number, email verification, 30 starter credits, and 30 referrer credits after verification.
- Added Google OAuth start/callback adapters with PKCE and state; local development uses a labelled mock Google identity until credentials are supplied.
- Added credential roles, auth identities, referrals, credit ledger, Deriv links, email verification, and password reset tables.
- Enforced one active site per account and required email verification plus a linked Deriv account before site creation.
- Added password reset tokens and verification/reset tests. Google sign-in is also tested through the local mock adapter.
- Verified locally: 81 unit tests, 12 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Commerce and provider adapters

- Added `009-commerce.sql`: domain price rules, domains, domain orders, commission entries, seller profiles, marketplace listings/orders, signal orders/deliveries, earnings ledger, and payouts.
- Added server commerce service for domain quote/search/buy/connect/verify/renew/remove, order listing, 15% commission recording, and commission summaries.
- Added DeepSeek AI adapter with deterministic mock mode, bounded live request, and XML output validation; added Paystack/M-Pesa payment adapter boundaries with mock checkout and webhook verification.
- Added commerce and provider unit tests.
- Local verification: 81 unit tests, 12/12 Playwright journeys, typecheck, build, format, audit, standalone package with no symlinks.

## 2026-10-20 — Server-backed domain desk

- Added `/api/studio/domains` with account-scoped search, quote, buy, connect, verify, renew, and remove actions.
- Wired the signed-in Domains page to the server commerce service; anonymous/demo users retain the dev mock.
- Added a `DomainProvider` boundary with a mock provider and an unconfigured Namecheap adapter that fails closed until sandbox access and IPv4 whitelisting are supplied.
- Added account/session/rate-limit/origin checks to domain mutations.
- Verified server-backed domain purchase and DNS/SSL advancement in the Playwright account journey.
- Final local verification: 88 unit tests, 12/12 Playwright journeys, typecheck, build, format, audit, standalone package with no symlinks.

## 2026-10-20 — Server billing, credit checkout, and commission import

- Added `010-payments.sql`: credit purchases, payment events, and an idempotent credit-ledger reference index.
- Added server credit checkout for the three configured packs; mock checkout grants credits immediately, while Paystack/M-Pesa live checkout remains gated.
- Added Paystack and M-Pesa webhook routes with duplicate-event handling and credit settlement.
- Wired the signed-in Billing page to the server credit ledger and purchase history.
- Added a Super Admin commission import API guarded by `SUPER_ADMIN_EMAILS`; records 15% of the imported gross partner commission.
- Added payment/credit/super-admin tests.
- Final local verification: 85 unit tests, 12/12 Playwright journeys, typecheck, build, format, audit, standalone package with no symlinks.

## 2026-10-20 — Live payment adapters and seller payout services

- Expanded Paystack checkout with server-side transaction initialization and M-Pesa Daraja OAuth/STK-push adapters; live modes fail closed without credentials.
- Added M-Pesa callback parsing for STK callbacks and idempotent settlement.
- Added marketplace seller profiles, approval, listing creation, 15% order split, earnings release, payout requests, Finance status transitions, and account-scoped earnings summaries.
- Added signal order creation, state transitions, delivery records, and cancellation guards.
- Wired signed-in Earnings to the server payout ledger; added seller/payout and signal API routes.
- Final local verification: 88 unit tests, 12/12 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Server marketplace, signals, payouts, and verification resend

- Added seller profiles, approval, listings, 15% marketplace split, earnings release, payout requests, and Finance status transitions.
- Added signed-in Marketplace and AI Signals server UIs; anonymous users retain the dev mock.
- Added signal order/delivery service and API with state-transition guards.
- Added Paystack transaction init and M-Pesa Daraja OAuth/STK-push adapters; live modes fail closed without credentials.
- Added an email outbox and verification resend endpoint; verification now records a development email fixture.
- Added unit tests for marketplace payouts, signals, payments, and providers.
- Final local verification: 88 unit tests, 12/12 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Admin commerce, delivery files, and SMTP

- Added Super Admin commerce review for seller approvals, payout status, and commission import.
- Added marketplace delivery content/files and buyer purchase delivery downloads.
- Wired signed-in Marketplace, AI Signals, Earnings, Billing, Domains, and Admin to server APIs.
- Added SQL-backed verification outbox and verification resend.
- Added an SMTP email adapter (nodemailer) with mock fallback; verification email delivery is attempted after token creation.
- Added tests for delivery content, seller listing, payouts, and mock email.

## 2026-10-20 — Telegram delivery and production M-Pesa endpoint

- Added a Telegram provider adapter with mock and live modes, bounded requests, and failure recording.
- Signal delivery now calls the Telegram adapter and records failed deliveries without claiming success.
- Made the M-Pesa base URL configurable for sandbox or production.
- Added provider tests for mock Telegram and mock email.
- Final local verification: 89 unit tests, 12/12 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Commerce RLS and Telegram/M-Pesa operations

- Added `013-commerce-rls.sql` with FORCE RLS for domains, orders, commissions, sellers, marketplace, signals, earnings, payouts, credit purchases, and Deriv links.
- Added transaction-local admin/service scopes for trusted admin and webhook paths.
- Added account ownership checks to signal deliveries and public/owner marketplace listing policies.
- Added Telegram provider mock/live modes and delivery failure recording.
- Added configurable M-Pesa base URL for sandbox/production.
- Final local verification: 89 unit tests, 12/12 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Private delivery storage and Super Admin e2e

- Added `014-marketplace-storage.sql` and a private local storage adapter for marketplace delivery files, with 256 KiB cap, 0700 directories, 0600 files, symlink/path checks, and private download routes.
- Marketplace purchases now return delivery metadata and a buyer-only download route.
- Added a Super Admin Playwright journey covering the allowlisted commerce review screen.
- Added `STORAGE_ROOT` and `SUPER_ADMIN_EMAILS` to the Playwright configuration for repeatable admin tests.
- Final local verification: 89 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Per-provider Telegram and private uploads

- Added encrypted per-provider Telegram connections with AES-256-GCM.
- Added Telegram connect/test/remove APIs and a connection panel in AI Signals.
- Signal delivery uses the provider connection when present, otherwise the platform bot token.
- Added marketplace uploads with a 5 MiB cap, XML/text/PDF allowlist, private storage, and upload metadata.
- Added buyer-only delivery downloads and storage tests.
- Final local verification: 92 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Malware scanning, provider health, and host acceptance

- Added marketplace upload scanning: basic allowlist/content checks and optional ClamAV path integration; unsafe uploads are deleted and rejected.
- Added scan metadata to uploads.
- Added `/api/health/providers` and `npm run provider:check` for redacted provider mode/configuration reporting.
- Added `host-acceptance.md` with the required Stellar Plus evidence checklist.
- Added malware-scanning tests.
- Final local verification: 95 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Studio gate, readiness, and host diagnostics

- Added a server wrapper for `/studio`: local mode keeps the demo; staging PostgreSQL requires a session and redirects unauthenticated users to `/login`.
- Added `/api/health/ready` for database, schema, RLS, and storage readiness without secrets.
- Added `npm run host:check` for a redacted host/configuration report.
- Updated the host acceptance checklist.
- Final local verification: 95 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Production gate, Namecheap adapter, and payout execution

- Added an explicit production account mode gated by `STUDIO_ENV=production` and `PRODUCTION_APPROVED=true`; staging remains separate.
- Added production-mode tests and the `/studio` session gate.
- Implemented Namecheap XML adapter calls for search, purchase, renewal, and auto-renew disable, with failing-closed credentials.
- Added a payout execution boundary with mock success and live provider fail-closed behavior; Super Admin “Pay” now executes the mock provider before marking a payout paid.
- Added Namecheap XML parsing and mock payout tests.
- Final local verification: 100 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Production domain provider wiring

- Wired live domain search, purchase, renewal, and auto-renew disable through the Namecheap adapter.
- Added encrypted registrant contacts for purchased domains.
- Added live registration contact validation and UI contact fields.
- Added payout execution through a mock/live provider boundary; Super Admin “Pay” executes before marking paid.
- Final local verification: 101 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Server bot library and generation

- Added `018-bots.sql` with account-scoped bot and generation-job tables.
- Added DeepSeek-backed bot generation with credit debit, refund on failure, XML validation, compatibility labels, site assignment, and removal.
- Wired signed-in XML Bots and AI Bot Generator to the server API; anonymous users retain the dev mock.
- Added bot generation/library tests and extended the Playwright account journey.
- Final local verification: 103 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## 2026-10-20 — Referral display, password recovery, support, announcements, account tools

- Displayed the account referral code with copy support in Settings.
- Added forgot-password and reset-password pages and APIs with non-disclosing request responses, rate limits, SMTP/dev reset delivery, and password policy enforcement.
- Added server-backed support tickets/messages, announcements, audit events, account export, and account deletion request/cancel.
- Added ServerSupport and ServerAnnouncements UI for signed-in users; anonymous users keep the dev mock.
- Added support/announcements/account lifecycle tests and expanded the account Playwright journey.
- Final local verification: 106 unit tests, 13/13 Playwright journeys, typecheck, build, format, audit.

## Public UI redesign

- Replaced the lowercase CSS `t` with the supplied angular T mark and the lowercase `tradeintra` wordmark.
- Added OS-default light/dark themes with persistence, favicon swap, animated reveal, and dark-surface tokens.
- Added floating six-link navigation and a mobile drawer.
- Added About and rebuilt Home, Developers, MCP, Status, Contact, Terms, and Privacy.
- Added original CSS/SVG product mockups, scroll reveals, sticky system cards, reduced-motion fallbacks, and no-JS reveal fallback.
- Updated Login/Signup with a premium split layout, field errors, email verification links, and a `/verify-email` page.
- Final verification: 128/128 unit tests and 27/27 Playwright tests, including light/dark axe, responsive widths, reduced motion, and no-JS.

## Latest verification

- 128/128 unit tests and 13/13 Playwright journeys passed after TOTP 2FA, invoices, bot refine/verify/sandbox, audit UI, signal cron, backup/monitor scripts, domain verification, manual transfer/price workflows, and retention/revocation archiving.
- Paystack/M-Pesa webhooks now settle pending signal subscriptions and pause signals on failed payment.
- Added `/openapi.json`, `/llms.txt`, and `/status`; status links live health/provider endpoints without secrets.
- Added public read-only MCP at `/api/mcp` with pricing, provider-mode, and boundary tools; account-scoped MCP remains gated.
- Signal checkout attempts now preserve every payment reference; renewals extend from the existing paid date.
- Payment hardening: mock provider is rejected outside mock mode; delivery requires a live trial or paid coverage; status activation is server-only.
- MCP notifications no longer receive replies; batches and protocol negotiation are validated; OpenAPI paths match real routes.
- Market refunds block downloaded goods and open payouts; account purge detaches site-linked assets before deleting sites.
- Paystack/M-Pesa callbacks are checked against the expected amount and currency; mismatches are recorded and do not activate service.
- Purge deletes private marketplace files after the database commit.
- Playwright now uses a 120-second journey timeout for the local PGlite path; the full suite completes in about 2.8 minutes.
- Custom domains now issue a TXT verification token and run DNS then TLS checks; mock mode advances them deterministically.
- Super Admin can edit TLD registration/renewal costs and markup; quotes still apply the configured markup.
- Purchase confirmation rejects stale prices; domain searches show approximate KES alongside USD.
- Transfer-in/out requests are queued for manual Support/Super Admin review with encrypted auth codes.
- TOTP 2FA is server-verified on password login and manageable from Settings.
- Credit, domain, marketplace, and signal charges issue invoices with optional `TAX_RATE_PERCENT` separation.
- Bot refine/verify/sandbox and the admin audit log are implemented.
- Added signal cron, database backup, and readiness-monitor scripts to the host checklist.
- Account purge archives retained financial/audit rows and queues Deriv/Telegram revocation tasks before deletion.
- Refunds block downloaded goods and open seller payouts; purge detaches site-linked domains, bots, and commissions.
- `FINANCE_EMAILS` and `SUPPORT_EMAILS` provide scoped admin access.
- `npm run account:purge` executes due 30-day deletion requests, including sites, versions, routing, sessions, account, and credential rows.

## 2026-10-23 — Step 2/3 module system

- Added the 15-module registry, canonical aliases, per-module operator content, and default template.
- Added the module editor with ordered cards and draft-safe content textareas.
- Published rendering now follows module order, honours header/hero/footer toggles, hides empty testimonials/stats/FAQ, and supports dark/light site themes.
- Server boundary rejects unsupported modules, normalizes legacy aliases, and guarantees risk disclosure.
- Verified 135 unit tests, 27 E2E tests, typecheck/format, and public-page axe checks in both dark and warm-paper themes.
- Preview now uses the same PublishedSite renderer as the public route, removing preview/published drift.
- Remaining: DeepSeek/credit removal, Deriv preset bot library, shared demo trading SPA, cPanel host check, commission ledger, Deriv OAuth, legal review.

## 2026-10-23 — Deriv presets replace AI bot generation

- Added 9 MIT-licensed Deriv DBot XML presets from `deriv-com/trading-bot-template`, with attribution and risk copy in `public/deriv-presets/`.
- Added the preset library UI: load, inspect/edit XML, store, validate, verify, and assign.
- Removed the AI Bot Generator page, DeepSeek provider, AI usage credits, bot generation/refinement charging, and the visible credit-pack billing surface.
- Raised the bot request limit to 256 KB so official preset XML saves correctly.
- Updated bot validation to accept official block XML while retaining script rejection.
- Started marketing/terms/auth copy migration away from AI credits and DeepSeek.
- Verified 133 unit tests, 27 E2E tests, production build, typecheck, and formatting.
- Removed the credits API, visible billing/credit surfaces, starter-credit grants, and AI provider status. Legacy credit tables remain only for database compatibility; they are not reachable from the product.

## 2026-10-23 — Shared demo trading workspace

- Added a dependency-free static demo SPA at `public/trade/` for the future `trade.tradeintra.com` cPanel subdomain.
- Demo only: simulated ticks, simulated balance, simulated Rise/Fall contracts, settlement, history, and reset. No Deriv credentials, deposits, withdrawals, balances, or real orders.
- Branding comes from sanitized query parameters (`site`, `name`, `accent`, `theme`).
- Added `/trade` local preview route that serves the same static artifact with corrected asset paths.
- Published sites now link the Trade module to `/trade` with the operator's brand parameters.
- Added `.htaccess`, MIT-safe static deployment notes, and cPanel acceptance steps.
- Added E2E coverage for branding, Deriv login notice, trade settlement, reset, mobile overflow, and axe.
- Verified 134 unit tests, 28 E2E tests, production build, typecheck, and formatting.
- Host checks remain blocked until the Namecheap Staging host/subdomain is available.

## 2026-10-23 — Commission statements and Finance review

- Added migration `035-commission-statements.sql` for submitted/approved/rejected statuses plus statement metadata.
- Owners can upload a monthly CSV from their own Deriv partner account; the server sums `gross_commission`/`commission`, records the 15% platform share, rejects duplicate files/periods, and stores an account-scoped copy for review.
- Finance/Super Admin can download the CSV, approve, or reject with a reviewer note.
- Added owner UI inside Earnings and Finance controls inside Admin commerce.
- Added audit events, duplicate-period uniqueness, Finance-only statement download, and public response redaction.
- Verified 135 unit tests, 28 E2E tests, production build, typecheck, and formatting.

## 2026-10-23 — cPanel release packaging hardening

- Excluded tracked root screenshots from the standalone release (99 MB -> 66 MB with runtime dependencies).
- Added a release verifier for required files, migrations, SPA assets, forbidden secret files, removed AI surfaces, image leakage, and oversize files.
- Copied the full `pg`/`postgres-*` runtime dependency tree and PGlite into the package because Turbopack tracing omitted package internals.
- Added commit, migration count, demo-only, and Trade SPA metadata to `RELEASE.json`.
- Smoke-tested the packaged `cpanel-start.js`: `/`, `/trade`, and `/api/health` return 200.
- Actual Namecheap cPanel/AutoSSL/Passenger validation is still blocked until host access.

## 2026-10-23 — Product-led landing and shared app shell

- Expanded the module registry to 20 and made new sites default to an 18-module product-led layout.
- Added capability grid, workspace showcase, strategy library, onboarding steps, access model, nav links, stronger hero, trust chips, and fuller footer behavior.
- Added a public workspace preview with accessible Overview/Markets/Strategies tabs.
- Upgraded the wizard thumbnail and module editor with features/steps content.
- Refactored `/trade` into a hash-routed demo app: Overview, Markets, Trade, Strategies, Signals, Reports, Learn, Settings, with desktop rail and mobile bottom navigation.
- Preserved the simulated trade engine, reports CSV export, demo reset, branding query parameters, and Deriv login notice.
- Added responsive, contrast, focus-retention, and navigation-state tests.
- Verified 139 unit tests and 30 E2E tests.

## 2026-10-23 — End-to-end builder audit (Mwangaza Markets)

- Created a second server-backed demo site through the actual builder: Mwangaza Markets, steel accent, deep-ink theme.
- Verified the published page renders 18 enabled modules (14 content sections plus chrome), 4 feature cards, 9 preset cards, 3 steps, access model, FAQ, trade launch, and risk.
- Verified the shared app routes: Overview, Markets, Trade, Strategies, Signals, Reports, Learn, Settings on desktop and mobile; trade settlement, report CSV export, theme switching, reset, back/forward, and focus retention.
- Audit fixes: client now blocks site creation before a Deriv link with a clear message; signup copy updated from 15 to 20 modules; steel accent text now passes dark-theme contrast; app preset links use the production preset base on the trading subdomain.
- Verified 139 unit tests, 31 E2E tests, axe on the new dark site/app (desktop and mobile), production build, and cPanel package verification.

## 2026-10-24 — Logo, no-code editor, and Deriv OAuth scaffold

- Added optional client logo upload: PNG/JPEG/WebP, client-side resize/WebP, config persistence, public builder preview, published header, shared-app logo endpoint, and app fallback monogram.
- Replaced pipe-delimited content fields with plain-language cards, add/remove controls, ticker chips, destination dropdowns, and advanced custom links.
- Added migration 036 for OAuth state and short-lived Deriv trader sessions.
- Added PKCE OAuth start/callback, encrypted verifier/token storage, HttpOnly session cookie, browser-bound state cookie, account listing, OTP endpoint, logout/revocation, CORS controls, and mock flow.
- OAuth sessions are bound to published site slugs; mock mode issues a clearly labelled demo session. Live execution remains gated by Deriv approval and the live feature flag.
- Added logo/editor/OAuth unit and E2E coverage.

## 2026-10-24 — True live builder preview

- Replaced the decorative wizard `MiniSite` with the real `PublishedSite` renderer.
- Preview now updates live for name, headline, description, logo, colour, theme, module toggles/order, and all operator content.
- Added page/phone preview modes, independent scrolling, sticky desktop preview, single-dialog full preview, and a clear live indicator.
- Added container-query layout rules so the real site renders correctly inside the narrow preview pane and phone frame.
- Moved and renamed the colour controls to “Brand colour”, grouped with theme, and added keyboard focus styling.
- Added tests for live headline/colour/theme/logo/feature updates, full-preview single dialog, mobile preview overflow, and 360px axe.

## 2026-10-24 — Full-screen live builder

- Converted the wizard modal into a full-screen builder with a fixed header/footer, scrollable form, and persistent preview.
- Added mobile/tablet Edit and Live preview tabs.
- Added a true device-width preview canvas: 1280px desktop and 390px phone, scaled to fit, with container layout switching at the real device width.
- Added auto-scroll from the active editor section to the matching preview section.
- Fields for disabled sections are hidden; clearing text fields now clears the preview; focus trap includes links and FAQ summaries.
- Simplified user-facing labels around sections, title, colour, address, and saving a demo version.
- Added live-preview, full-preview, mobile-tab, overflow, and 360px axe coverage.
