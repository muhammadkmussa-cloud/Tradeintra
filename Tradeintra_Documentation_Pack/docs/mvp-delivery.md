# Local mock MVP delivery — 2026-10-20

## Release boundary

**Runnable end-to-end local/staging-development MVP implemented. Not a completed production platform or a passed Namecheap hosting POC.**

The owner requested continued implementation through a finished runnable experience. The delivered slice is account → template → limited brand kit → three mock modules → globally reserved preview name → public same-server mock snapshot → private draft edits → append-only restore. It does not supersede the confirmed hosting decisions or authorize a public/paid/provider launch.

The browser-only demo remains usable without an account. Authenticated account workspaces use a separate server-side schema, not the diagnostic fixtures and not browser localStorage.

## Implemented acceptance evidence

| Capability                | Evidence / boundary                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration, sign-in/out | Salted Node scrypt hashes; random 256-bit session tokens stored only as hashes; HttpOnly/Lax cookies and Secure on HTTPS; seven-day expiry. Email remains explicitly unverified; no recovery/2FA or identity verification claim.      |
| Account isolation         | Actor derived from stored session, never client account IDs; strict payload schemas; FORCE RLS and transaction-local scope; cross-account read/write and missing-scope tests. No team/admin roles.                                    |
| Site creation             | Curated Deriv Studio wizard with name/accent/copy, three module toggles, reserved-name and cross-account conflict validation. Logo uploads, typography presets, and contact/social forms are not delivered.                           |
| Draft privacy             | Saving edits does not change the published snapshot; anonymous access to an unpublished name returns 404. Browser tests exercise both states.                                                                                         |
| Mock publication          | Transactional immutable snapshot, exposed via `/sites/slug`; pages use required risk text and mock labels. This is NOT a real `slug.tradeintra.com` hostname or DNS/SSL verification.                                                 |
| Restore                   | A prior snapshot becomes a new immutable version; previous versions remain unchanged. DB trigger blocks update/delete.                                                                                                                |
| Concurrency/retry         | Account row lock, revision conflict handling, idempotent operation IDs, duplicate-submit guard, draft preserved on errors; regression test ensures expired-session refresh cannot write private account state into demo localStorage. |
| Account settings          | Workspace name, mock Deriv link flag, configuration export, sign-out, site archive. No real Deriv access, credentials, or transactions.                                                                                               |
| Abuse/input guards        | Same-origin POST requirements, HTTPS outside loopback, 16 KiB streamed JSON cap, strict fields, parameterized SQL, persistent per-email/global login/registration and per-account mutation limits.                                    |
| Persistence               | Private local PGlite database; built Node server register/save/render followed by process stop/restart/login/render was actually tested. Not a hosted PG/Passenger proof.                                                             |
| Responsive/accessibility  | Five target widths for studio, mobile account/wizard overflow check, keyboard modal flow, axe checks on existing screens, account form and published renderer. Not full manual WCAG certification.                                    |
| CI preparation            | GitHub Actions file added for format/type/unit/browser/build/audit checks; no remote workflow or deployment was run in this session.                                                                                                  |

## Development versus staging

- Local account development defaults on only under `next dev`, or an explicitly selected `STUDIO_DB_MODE=local` / `STUDIO_ENV=local` built local runtime. PGlite is a dev dependency, not a production hosting/database choice. Use one process per local directory. Local initialization creates only the private local development schema.
- A normal built/production runtime defaults to server accounts disabled. Anonymous browser demo still works.
- PostgreSQL is allowed only with `STUDIO_DB_MODE=postgres`, `STUDIO_ENV=staging`, `STUDIO_ENABLED=true`, `APP_URL`, `DATABASE_URL`, and an explicitly applied `database/002-studio.sql`. No hosted auto-migration or failed-PostgreSQL fallback.
- Real staging requires the runbook and prior owner-approved host access. `npm run studio:migrate -- --apply` targets only a dedicated staging schema/database and must not run against production/customer data.
- Existing `tradeintra_poc` fixture schema/host mapping and `POC_ENABLED` are separate. A diagnostic tenant render does not expose an account draft or certify an account publication.
- Private local data directory is `~/.local/share/tradeintra-studio` by default, not committed or copied into repository artifacts. Node/Next process reuse is guarded by a process singleton and a FIFO transaction lease for the single-session local engine.

## Security details and explicit limits

- Passwords are 12–128 characters, hashed using salted scrypt (N=16384, r=8, p=1, 64-byte output). Unknown-account checks still do a scrypt operation. Account-exists registration responses are not a full anti-enumeration design; review before production.
- Sessions expire after seven days and sign-ins retain at most five sessions, with per-identity locking and a concurrent sign-in test. Sign-out deletes the presented token hash and expires the cookie, including already expired sessions. Cookies are host-only; no token is returned in JSON or stored in localStorage.
- Account scoping is derived from session-owned credentials and bound into an SQL transaction. Credentials, session lookup, internal routing reservations, and limiter tables are server-internal; they are not public list APIs. A compromised DB application role/server remains a distinct threat requiring production review.
- Strict JSON rejects caller-supplied ownership/unknown executable fields. Config is rendered as React text and constrained color/module values, not arbitrary HTML/CSS/JS.
- Names remain reserved for the site's historical snapshots until archive, preventing another site from taking an older name. Archiving removes public access/releases names but preserves private immutable history. Full personal-data deletion, retention jobs, and legal review are still required.
- Development resource limits are one active site per account (replacement allowed after archive/delete) and fifty versions per site, not approved commercial plan entitlements. Old retry-operation records expire after seven days. Limiter windows are cleaned after a day.
- No forwarded-IP trust is used for auth limits; global + per-email buckets protect the shared runtime. The development Arena preview origin can be derived only from the server's own sandbox ID/port. Staging pins APP_URL. Load/abuse ceilings and distributed proxy behavior still require real-host measurement.
- No production clickjacking/CSP nonce policy, independent penetration test, mail delivery, recovery, 2FA, asset upload/virus scan, encryption/backup/erasure program, or customer-facing legal documents are certified. Development/staging is for synthetic data only.

## Remaining production gate

The original hosting POC remains open: actual cPanel/Passenger startup/restart/rollback, networked pg/PostgreSQL 10.23 behavior and concurrent connections, real hostname routing and wildcard/custom TLS, quotas/inodes/memory, cron scheduler, backups, real account/email security review, upload isolation, provider/legal approvals, and production release approval.

No real hosting account, credentials, approved staging domains, live Deriv, SMTP, or payment/registrar configuration was supplied. No paid resource, DNS change, public deployment, provider call, purchase, or financial transaction was performed. Unavailable product modules are clearly deferred rather than simulated as working integrations.

## Final executed checks

On 2026-10-20: format check, TypeScript, **59 unit/SQL/security tests**, **8 browser tests**, production build, and `git diff --check` passed. `npm audit` reported **0 vulnerabilities**. The built-server disk/restart test was executed separately as described above; its isolated synthetic data was removed. Automated accessibility covers the specified screens/flows, not a manual full-product WCAG audit. GitHub Actions was configured but not run remotely.
