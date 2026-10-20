# Non-Functional Requirements

Targets are starting principles, not promises. Set measurable SLOs after the POC and first traffic baseline.

## 1. Security

- Server-side authorization on every protected action.
- Tenant isolation for data, files, logs, jobs, domains, and publishes.
- Postgres RLS plus scoped application queries.
- Secrets in cPanel environment variables, never in source, config JSON, or tenant files.
- Dependency, container/image, and secret scanning.
- Sensitive actions audited.
- Least privilege for cPanel/Namecheap, registrar, payment, Deriv, and AI credentials.
- Arbitrary generated apps are deferred; module configuration only.
- Domain registrant contacts encrypted and access-controlled.
- OAuth/PKCE state and verifier bound to the session and short-lived.

## 2. Reliability

- Long-running builds, domain orders, and publishes run asynchronously.
- Jobs are durable, idempotent, and retryable where safe.
- Failed jobs never report success.
- External failures produce safe, actionable errors.
- Domain/DNS/SSL states reflect provider truth.
- Backups and restore procedures are documented and tested.
- Dead-letter queues and stuck-job detection.

## 3. Performance

- Establish baselines with realistic data.
- Paginate lists, logs, and transactions.
- Avoid loading all tenant records into the browser.
- Cache published tenant configuration with correct invalidation.
- Set timeouts for external calls.
- Domain search should respond within a short-lived cache window; live checks may take longer.
- Publish should not rebuild the whole renderer.

## 4. Availability and observability

- Health/readiness checks for control plane and workers.
- Structured logs with request/job correlation IDs.
- Monitor API errors/latency, queue depth, publish failures, domain failures, SSL failures, payment failures, AI spend, and Deriv mock/live status.
- Alert thresholds after baseline.
- Status communication for provider incidents.

## 5. Accessibility

- WCAG 2.2 AA target.
- Keyboard-operable navigation and controls.
- Visible focus.
- Correct labels and error associations.
- Sufficient contrast, including yellow buttons.
- Do not rely on colour alone.
- Reduced motion respected.

## 6. Compatibility

- Current major desktop and mobile browsers.
- Responsive at 360, 390, 768, 1024, 1440 px.
- Touch and keyboard support.
- Test generated sites and domain flows on mobile.

## 7. Maintainability

- Clear module boundaries.
- Lint, format, type-check, and test conventions.
- Versioned migrations.
- Provider adapters for Namecheap domains, payments, Deriv, AI, and email.
- No Redis or external database as a required dependency.
- Shared-hosting CPU/memory/inode/cron limits are treated as hard constraints.
- Documented environment setup.
- No undocumented customer-code execution.

## 8. Data integrity

- Foreign keys and uniqueness constraints.
- Transactions for multi-record state changes.
- Immutable published configuration versions.
- Idempotency for domain/payment/publish/release.
- Retention, export, and deletion behavior.
- Audit events append-only.

## 9. Scalability

- Separate request handling from cron-driven publish/job work.
- Apply per-plan quotas and concurrency limits.
- Batch domain operations within provider rate limits.
- Measure before adding microservices.
- Keep wildcard routing and tenant lookup efficient.

## 10. Domain-specific requirements

- Availability and price re-checked before purchase.
- `expectedPrice` protection.
- No duplicate registrations.
- DNS/SSL verified before “live”.
- Renewal reminders and retries.
- Transfer-out documented.
- Abusive/impersonating domains blocked.

## 11. Shared-hosting requirements

- One cPanel Node.js process; no per-tenant process.
- Cron minimum interval is 5 minutes; no more than 5 simultaneous cron jobs.
- Jobs must complete within a bounded window and tolerate delay.
- No Redis, persistent worker daemon, Docker, or external database.
- Local storage quotas and inode limits are enforced and monitored.
- PostgreSQL 10.23 compatibility is tested; newer SQL features are avoided.
- Wildcard DNS/SSL and cPanel addon-domain behavior are verified on the actual account.
- Shared CPU/memory limits are measured before promising tenant counts.

## 12. Deriv-specific requirements

- Mock mode is the default until approval.
- Simulated data visibly labelled.
- No live order routing in mock mode.
- Rate-limit and reconnect behaviour tested.
- Tokens never exposed to browsers or tenant configuration.
- Markup and commission shown separately.

## 12. Compliance

- Do not claim regulatory authorization or Deriv affiliation.
- Do not promise profits.
- Publish risk disclosures.
- Legal review for domain resale/markup, payments, and any live financial integration.
- Data protection for registrant and end-user data.
