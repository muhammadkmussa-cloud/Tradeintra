# Known Issues and Limitations

## Current limitations

- A local mock studio now exists; no production backend exists yet.
- No Deriv account, partner approval, or OAuth app credentials.
- Stellar Plus shared-hosting limits are not yet measured.
- Wildcard subdomain routing and SSL behavior are unverified.
- cPanel automation for addon domains/subdomains is unverified.
- PostgreSQL 10.23/Kysely compatibility is unverified.
- Cron is limited to a 5-minute minimum and 5 simultaneous jobs.
- Next.js build/process memory may exceed shared-hosting limits.
- No Redis, persistent worker, VPS, Vercel, Neon, or external hosting fallback is permitted.
- Live Deriv integration is not available; mock mode only.
- Namecheap registrar markup/resale terms and registrant ownership need legal review.
- Exact Namecheap API access, TLD coverage, and pricing must be verified at implementation time.
- DForge site editor, deployment logs, marketplace, and bot store were not fully inspectable because the account had no site and establishing a Deriv link is permanent.
- Reference contradictions remain: Bot Store “Coming Soon” vs marketplace marketing; support ticket mention vs dashboard; AI balance/credit differences.
- Plan pricing and limits are not final.
- Domain markup values are not final.
- Payment-agent functionality is deferred.
- Marketplace/signals are phase 2/3.
- No tax/VAT policy yet.
- No production support SLA yet.

## Issue template

For each issue record:
- ID
- Summary
- Environment
- Reproduction steps
- Expected result
- Actual result
- Severity
- Workaround
- Owner
- Status
- Related test/decision

## 2026-10-20 implementation update

The root application now runs as a mock/local studio. The earlier “no application” note is superseded. All hosting/provider limitations above still apply.

- Browser-only storage has no authentication, tenant isolation, synchronization, or server backup. Never enter sensitive data.
- Publishing is a local version snapshot, not a public site. DNS and SSL are unverified.
- Multiple tabs can overwrite each other; use one studio tab. JSON export is available; import is not implemented.
- Logo upload, typography presets, social/contact fields, real plans/limits, and production modules are not implemented.
- Module toggles and full previews are functional; bot/signal/marketplace/payment tools are explicitly deferred.
- Automated accessibility checks cover selected screens only; manual assistive-technology/touch testing remains open.

## 2026-10-20 — Staging harness limitations

- `POC_ENABLED` defaults off. No cPanel staging URL/database or real host credentials were configured in this session.
- New SQL tests use PGlite, a newer PostgreSQL-in-WASM engine; real pg sockets/TLS, PostgreSQL 10.23, pooled/concurrent sessions, and Passenger remain unverified.
- The staging DB schema is not the production account/auth/data model. A session SQL join probe is not sign-in, password handling, email verification, RBAC, or tenant authorization certification.
- The file store only handles bounded private diagnostic text files. Customer uploads, scanning, aggregate quotas, inode ceilings, and retention are not implemented.
- Migrations are idempotent POC setup, not a versioned production migration system; schema drift requires review.
- Liveness is not DB/SSL readiness. Mapped tenant pages require both an exact host allowlist and seeded DB mappings; no automatic fallback/provisioning. The real proxy must preserve Host.
- A local cron tick and completion row do not prove cPanel scheduling or shared-host load limits.
- The browser-local studio and server POC do not synchronize data. No sensitive/customer data should be entered into either.

## 2026-10-20 — Current local MVP limitations (supersedes earlier no-backend notes)

- A server-backed local account/site/publish workflow now exists. Anonymous demo state is still browser-local and separate. See `mvp-delivery.md` for implemented scope.
- Local PGlite is single-process development storage, not PostgreSQL 10/cPanel compatibility evidence. Source snapshots do not include its private on-disk DB. Use a private backup and one process per directory.
- Actual pg networking, PG 10.23, cPanel/Passenger, DNS/SSL, cron/resource ceilings, and production isolation/load remain unverified. Production server accounts default off.
- Local/staging custom auth has no verified email, recovery, 2FA, admin/team RBAC, external security audit, or production support/abuse guarantees. Synthetic data only.
- Public `/sites/slug` paths expose only mock published configuration; they are not actual tradeintra.com subdomains. Anyone with the URL can read that published mock copy.
- Brand kit supports name/accent/headline/description and module choices only: customer logo upload, typography controls, contact/social forms, and full legal pages are not delivered.
- Site deletion in an account is archive, not permanent erasure. Private immutable history is retained; full account erasure/retention automation and JSON import remain unavailable.
- Development limits are not approved commercial plans. Live Deriv, domains, billing, payouts, bots/AI/signals/marketplace and email remain unavailable.
