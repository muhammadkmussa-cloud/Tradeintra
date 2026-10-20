# Release Checklist

## Scope and approval

- [ ] Release scope and acceptance criteria approved.
- [ ] Deriv mode is mock (or live approval is documented).
- [ ] Payment-agent feature is disabled.
- [ ] Domain pricing/markup approved.
- [ ] Registrar terms/ownership reviewed.
- [ ] Known limitations documented.
- [ ] Owner approved public/paid/external actions.

## Code quality

- [ ] Lint/format/type checks pass.
- [ ] Unit/integration tests pass.
- [ ] E2E critical journeys pass.
- [ ] Production build succeeds.
- [ ] No unresolved critical/high security findings.
- [ ] No secrets committed.
- [ ] Dependency review completed.

## Security and data

- [ ] Tenant isolation tests pass.
- [ ] Authorization verified for sensitive actions.
- [ ] Secrets/logs redacted.
- [ ] Rate limits configured.
- [ ] Domain contact data encrypted/masked.
- [ ] cPanel/Namecheap credentials scoped/rotated.
- [ ] Backup/restore tested.
- [ ] Retention/deletion documented.

## Release and hosting

- [ ] cPanel Node app, domains, and wildcard/addon domains configured.
- [ ] `tradeintra.com` and `*.tradeintra.com` verified with SSL.
- [ ] DNS/SSL status verified.
- [ ] Environment variables configured securely.
- [ ] Migrations reviewed/tested.
- [ ] DB job queue and cPanel cron healthy.
- [ ] Domain rate limits/queues configured.
- [ ] Health checks/monitoring work.
- [ ] Rollback procedure known.
- [ ] PostgreSQL 10.23 compatibility verified.
- [ ] File/inode limits and storage quotas verified.
- [ ] cPanel Node app restart/rollback verified.

## Product and UX

- [ ] Template/brand kit/modules work.
- [ ] Required risk disclosure present.
- [ ] Free subdomain flow works.
- [ ] Domain search/purchase/connect works.
- [ ] Simulated data labelled.
- [ ] No fake metrics/testimonials/claims.
- [ ] Legal pages/privacy/terms reviewed.
- [ ] Support path available.
- [ ] Mobile/keyboard/contrast checks done.

## Final approval

- [ ] Known issues reviewed.
- [ ] Release notes prepared.
- [ ] Owner approves release.
- [ ] Post-release monitoring assigned.

## Local prototype evidence — 2026-10-20 (not production sign-off)

- [x] Local mock template/brand/module wizard and preview implemented.
- [x] Configuration validation and immutable snapshot/restore unit tests executed.
- [x] Core browser creation, persistence, restore, search, link, and deletion journeys executed.
- [x] Responsive overflow checks at five required widths executed.
- [x] Automated axe checks on key desktop screens and wizard steps executed.
- [x] Local production build and TypeScript checks executed.
- [x] Limitations documented in `local-poc-report.md` and root README.
- [ ] Real account/tenant isolation and authorization verified.
- [ ] Namecheap cPanel/PostgreSQL/DNS/SSL/files/cron POC passed.
- [ ] Full production acceptance criteria and owner release approval.

Do not mark the production checklist above complete based on these browser-local checks.

## Staging harness preparation — 2026-10-20

- [x] Built Node startup/liveness and opt-in hostname routing implemented.
- [x] Local SQL/RLS/published-snapshot/rollback and filesystem isolation tests executed.
- [x] Local built-server negative-path routing/liveness smoke checks executed.
- [x] Secure environment template and cPanel POC execution/rollback runbook added.
- [ ] Real cPanel/Passenger Node startup/restart/rollback verified.
- [ ] Real pg connection/TLS and PostgreSQL 10.23 migration/transaction behavior verified.
- [ ] Three tenant subdomains plus custom-domain alias served over valid HTTPS.
- [ ] Actual cPanel cron schedule, resource limits, file quotas/inodes measured.
- [ ] Production auth, complete tenant isolation, uploads, and release authorization verified.

All unchecked host/production items remain blockers; local SQL/HTTP tests are not a production sign-off.

## Local mock MVP acceptance — 2026-10-20

- [x] Register/sign-in/out and server account workspace implemented and tested locally.
- [x] Account → template → brand/modules → reserved name → mock URL workflow tested in browser.
- [x] Private draft/public snapshot separation, immutability/restore, ownership denial, conflicts/retries and request guards tested.
- [x] Account data kept separate from anonymous demo localStorage; expiry regression covered.
- [x] Built Node runtime persistence through actual process stop/restart verified with isolated synthetic data.
- [x] Responsive/keyboard/automated-accessibility checks include account form and public renderer.
- [x] Mode controls, limitations, current evidence and setup recorded in `mvp-delivery.md`/root README.
- [ ] Actual Namecheap/cPanel/PostgreSQL 10/DNS/SSL/cron host gate.
- [ ] Verified email/recovery/2FA, full auth/security/abuse review and real host isolation/load.
- [ ] Full brand uploads/typography/contact, provider integrations, retention/erasure, legal/ops and production release approval.

The checked local MVP items are NOT a full production release or completion of every PRD feature.
