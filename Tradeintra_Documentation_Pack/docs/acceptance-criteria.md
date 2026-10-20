# Acceptance Criteria

## Account access

- User can register, verify email, sign in, sign out, recover access, and enable 2FA.
- Invalid credentials produce safe errors.
- Protected routes/APIs require valid authorization.
- Recovery does not disclose arbitrary account existence.

## Deriv linkage (mock)

- User can complete a mock Deriv link.
- Mock status is clearly shown.
- No real token or order is created.
- Live mode is blocked by a server-side gate.
- Failure/cancel/timeout paths are handled.

## Site creation

- User can select the Deriv trading template.
- User can set logo, colours, typography, copy, links, and required risk disclosure.
- User can enable/configure compatible modules.
- Invalid configuration is rejected with field-level guidance.
- Draft persists after reload.
- Unsaved changes are handled.
- Preview reflects the draft.
- Required disclosures cannot be removed.

## Stellar Plus hosting

- Tradeintra itself runs on the cPanel Node.js app.
- Wildcard subdomains route to the shared runtime over HTTPS.
- PostgreSQL 10.23 migrations/transactions/RLS work.
- Three tenant configurations render correctly.
- Tenant data/file isolation passes.
- Cron jobs run without overlap.
- File uploads respect measured limits.
- Release upload/restart/rollback works.

## Publishing

- Publish creates an immutable configuration version.
- Only authorized users can publish.
- Publish states reflect actual status.
- Failure does not report success.
- Prior version remains live on failure.
- Rollback works.
- Live URL appears only after verification.

## Subdomains

- Valid `slug.tradeintra.com` can be reserved and published.
- Invalid/taken/reserved/abusive slugs are rejected.
- HTTPS works.
- Tenant isolation is enforced.

## Domains

- Search shows available/taken/unsupported.
- Registration and renewal prices are shown.
- Price is re-checked before purchase.
- Registrant contacts are validated and protected.
- Successful purchase creates a domain/order/audit record.
- Duplicate purchase is prevented.
- Failed registration refunds/credits.
- DNS/SSL status is accurate.
- Connected domains verify.
- Renewal reminders/retries are observable.
- Registrant ownership/transfer-out is documented.

## Bots

- XML upload validates and scans.
- Bot belongs to the correct tenant.
- AI generation deducts credits correctly.
- Generated bot is validated/tested.
- Compatibility label is accurate.
- Bot can be assigned to a site.

## AI Builder

- Arbitrary generated applications are deferred until a safe execution model exists.
- AI may assist with validated module configuration only.

## Billing

- Entitlements enforced server-side.
- Webhooks signed and idempotent.
- Redirect alone cannot grant paid access.
- Failed/cancelled subscriptions follow policy.
- Domain and credit ledgers reconcile.
- Payouts are not executed by MCP.

## Security

- Cross-tenant read/write/publish/domain/log tests pass.
- Role/entitlement escalation tests pass.
- Secrets are not exposed.
- Rate limits work.
- Tenant files cannot access platform secrets or other tenants.

## Brand and UI

- Uses `#FEDD00`, `#0D000A`, `#F3F2F2`.
- Approved logo/wordmark used consistently.
- Desktop and mobile usable.
- Keyboard/contrast checks pass.
- Loading/empty/error states exist.
- Simulated data is labelled.

## Release

- Required tests pass.
- No unresolved critical/high security issues without accepted risk.
- Setup/release docs complete.
- Backup/restore documented/tested.
- Owner approves external/paid actions.
