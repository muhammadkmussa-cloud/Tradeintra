# Practical Testing Checklists

## Local development

- [ ] Setup works from a clean checkout.
- [ ] `.env.example` contains placeholders only.
- [ ] Migrations run.
- [ ] Lint/format/type checks run.
- [ ] Unit tests run.
- [ ] App starts with `DERIV_MODE=mock`.
- [ ] No secrets are tracked by Git.

## Authentication

- [ ] Valid login succeeds.
- [ ] Invalid login fails safely.
- [ ] Email verification works.
- [ ] Password recovery works.
- [ ] 2FA setup/verify/recovery works.
- [ ] Logout invalidates the session.
- [ ] Rate limits work.
- [ ] Protected APIs reject unauthenticated requests.

## Deriv mock mode

- [ ] Mock OAuth callback works.
- [ ] Mock accounts/balances/symbols load.
- [ ] Simulated badge is visible.
- [ ] Mock order never calls Deriv.
- [ ] Live mode cannot be enabled by a client-side flag.
- [ ] Failure/cancel/timeout paths work.

## Site builder

- [ ] Template gallery loads.
- [ ] Deriv trading template previews.
- [ ] Brand kit saves and reloads.
- [ ] Required risk disclosure cannot be removed.
- [ ] Modules enable/disable/configure.
- [ ] Incompatible module is rejected.
- [ ] Invalid config shows field-level errors.
- [ ] Preview matches draft.
- [ ] Publish creates an immutable version.
- [ ] Rollback works.
- [ ] Unsaved changes are handled clearly.

## Subdomains

- [ ] Valid slug available.
- [ ] Taken/reserved/invalid slug rejected.
- [ ] `slug.tradeintra.com` routes to correct tenant.
- [ ] HTTPS works.
- [ ] Tenant A cannot use Tenant B’s slug.

## Domains

- [ ] Availability and price shown.
- [ ] Taken/unsupported/premium handled.
- [ ] Price re-check before purchase.
- [ ] Contact validation.
- [ ] Payment success → order submitted.
- [ ] Payment failure → no registrar call.
- [ ] Duplicate purchase prevented.
- [ ] Registration failure → refund/credit.
- [ ] DNS/SSL status accurate.
- [ ] Connect external domain verifies.
- [ ] Renewal reminder/retry.
- [ ] Registrant data masked in support.

## Stellar Plus hosting

- [ ] cPanel Node.js app starts.
- [ ] Next.js build runs within memory/CPU limits.
- [ ] PostgreSQL 10.23 connection/migrations/transactions work.
- [ ] Wildcard `*.tradeintra.com` routes to the shared runtime.
- [ ] Wildcard or per-subdomain HTTPS works.
- [ ] Custom addon domain + SSL works.
- [ ] Three tenant configs render on separate hostnames.
- [ ] Tenant data/file isolation passes.
- [ ] Cron job runs at 5-minute intervals without overlap.
- [ ] File uploads respect disk/inode limits.
- [ ] Release upload/restart/rollback works.

## Publish and release

- [ ] Job is durable after API response.
- [ ] Duplicate publish is safe.
- [ ] Queued/building/publishing/verifying/success/failure states accurate.
- [ ] Failed publish leaves prior version live.
- [ ] Logs are authorized and redacted.
- [ ] Rollback works.
- [ ] Quotas enforced.
- [ ] Release upload/restart/rollback works.

## AI Builder

- [ ] Arbitrary generated apps are disabled.
- [ ] AI configuration assistance (if enabled) produces validated config only.

## Billing

- [ ] Webhook signature verified.
- [ ] Duplicate webhook idempotent.
- [ ] Invalid webhook rejected.
- [ ] Entitlements update from trusted state.
- [ ] Redirect alone cannot grant access.
- [ ] Cancellation/failed payment follow policy.
- [ ] Credit ledger balances.
- [ ] Payout not executed by MCP.

## Tenant isolation

- [ ] User A cannot list/read/edit/publish/delete User B’s site.
- [ ] User A cannot attach User B’s domain.
- [ ] User A cannot read User B’s assets/bots/logs.
- [ ] Workers enforce ownership.
- [ ] Tenant files/config cannot read other tenants’ data.

## UI and accessibility

- [ ] Mobile and desktop layouts work.
- [ ] Keyboard navigation works.
- [ ] Focus visible.
- [ ] Labels and errors associated.
- [ ] Contrast checked.
- [ ] Reduced motion respected.
- [ ] Loading/empty/success/error states present.
- [ ] Simulated data labelled.
