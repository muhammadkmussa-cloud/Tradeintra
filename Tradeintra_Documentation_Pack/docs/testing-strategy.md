# Testing Strategy

## 1. Test layers

### Unit

- configuration schema validation;
- module compatibility;
- permission/entitlement checks;
- publish/release/job state transitions;
- domain price/markup calculation;
- idempotency key handling;
- error mapping/redaction;
- mock Deriv fixtures.

### Integration

- Postgres persistence, constraints, and RLS;
- API authorization and tenant scoping;
- queue/job lifecycle;
- Namecheap domain adapter (sandbox/test);
- cPanel DNS/addon-domain/SSL behavior on Stellar Plus;
- payment webhook verification/idempotency;
- AI provider adapter;
- Telegram adapter (phase 2);
- email delivery.

### End-to-end

- register → verify → sign in;
- mock Deriv link;
- create site from template;
- brand kit + modules;
- preview;
- free subdomain publish;
- domain search → purchase (test) → DNS/SSL → active;
- connect external domain;
- publish/rollback;
- bot upload/generate/verify;
- AI Builder is deferred; no generated-code runtime.
- signal order/Telegram (phase 2);
- plan upgrade/downgrade;
- account deletion.

### Security

- IDOR/cross-tenant access;
- role escalation;
- invalid/expired sessions;
- 2FA bypass attempts;
- CSRF/CORS;
- rate limits;
- malicious uploads/XML;
- secret leakage;
- webhook replay;
- domain takeover;
- generated-app isolation;
- prompt injection/unsafe generated code.

### UI/accessibility

- responsive breakpoints;
- keyboard navigation;
- focus visibility;
- labels/errors;
- contrast;
- reduced motion;
- empty/loading/error states;
- simulated-data labels.

## 2. Stellar Plus hosting tests

- cPanel Node.js app start/restart.
- Next.js build/run within CPU/memory limits.
- PostgreSQL 10.23 driver/migrations/transactions/RLS.
- Wildcard subdomain routing.
- AutoSSL/wildcard certificate coverage and renewal.
- Custom addon domain + SSL.
- DB job execution via 5-minute cron.
- File upload/disk/inode quotas.
- Release upload/restart/rollback.
- Measured practical tenant count.

## 3. Domain tests

- available/taken/unsupported results;
- price mismatch;
- premium domain;
- contact validation;
- `202`/`action_required`/`failed` handling;
- duplicate purchase;
- payment succeeded but registration failed;
- DNS/SSL pending → active;
- renewal reminder/retry;
- transfer-out policy;
- abuse/reserved names.

## 4. Deriv mock/live tests

- mock OAuth success/failure/cancel;
- mock token expiry;
- mock rate-limit error;
- mock WebSocket disconnect/reconnect;
- live-mode gate cannot be enabled accidentally;
- simulated data labels persist across UI/exports.

## 5. Tenant isolation tests

- User A cannot list/read/edit/publish/delete User B’s sites.
- User A cannot attach User B’s domain.
- User A cannot read User B’s assets, bots, logs, or earnings.
- Workers re-check ownership.
- Tenant files/config cannot read another tenant’s data.

## 6. Test data

Use synthetic data. Never use real customer credentials, real Deriv tokens, or production registrar contacts.

## 7. CI expectations

Run formatting/linting, type checks, unit tests, integration tests where practical, build checks, and secret/dependency scanning. Production release requires the agreed checks and approvals.

## 8. Reporting

For each run record: date/commit, command, environment, passed/failed/skipped, failure details, known limitations. Never report a test as passed if it was not executed.
