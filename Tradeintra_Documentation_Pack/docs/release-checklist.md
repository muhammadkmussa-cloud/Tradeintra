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
