# Security and Privacy Baseline

## 1. Threat-sensitive areas

- Cross-tenant data leakage.
- Unauthorized site edits, publishes, or releases.
- Domain takeover or misassignment.
- Registrar contact data exposure.
- Deriv token/OTP leakage.
- cPanel/Namecheap API credential misuse.
- Future generated-code escape (deferred).
- Payment webhook forgery/replay.
- AI prompt injection or unsafe generated code.
- Privileged support/admin misuse.
- Subdomain squatting/impersonation.

## 2. Required controls

1. Server-side authorization on every protected operation.
2. Tenant-scoped queries and Postgres RLS where supported.
3. Strong password hashing and secure session lifecycle.
4. Email verification and optional TOTP 2FA.
5. Rate limits on auth, domain search/purchase, publish, AI, and costly actions.
6. CSRF protection for cookie-authenticated state changes.
7. Strict CORS and secure transport.
8. Secrets in a secret manager; never in source or config JSON.
9. Redaction of tokens, OTPs, registrar contacts, and payment data from logs.
10. Dependency, secret, and generated-code scanning.
11. Arbitrary AI-generated apps are deferred; module configuration only.
12. CPU, memory, time, storage, and concurrency quotas.
13. Audit trails for publish, domain, billing, role, and admin actions.
14. Safe upload rules for logos, documents, and XML bots.
15. Verified, idempotent payment webhooks.
16. Backup access controls and recovery tests.
17. Documented vulnerability reporting and incident response.

## 3. Domain-specific controls

- Re-check availability and price before purchase.
- Use idempotency keys and `expectedPrice`.
- Encrypt registrant contacts at rest.
- Restrict contact access to billing/support/Super Admin.
- Verify ownership before attaching a domain.
- Do not route traffic until DNS/SSL are verified.
- Prevent duplicate domain assignment.
- Block reserved/abusive/impersonating domains.
- Audit transfers, removals, renewals, and contact changes.

## 4. Deriv-specific controls

- Mock mode by default; live mode behind a server-side flag.
- OAuth state/PKCE bound to the session.
- Token exchange server-side.
- Tokens encrypted at rest; never sent to the browser or tenant configuration.
- OTP WebSocket URLs never logged.
- One Deriv link per account at launch.
- Revoke tokens on account deletion or suspected compromise.
- Do not claim live data when in mock mode.

## 5. Generated code

Arbitrary generated apps are deferred (`ADR 0014`). The launch platform must not execute customer-supplied code. If generated code is reintroduced, it requires a separate isolation model, secret scanning, dependency checks, and a runtime that Stellar Plus can safely support. Do not reuse the shared runtime for untrusted code.

## 6. Privacy categories

Collect only what is needed:

- account details (name, email);
- country;
- linked Deriv identifiers (no password);
- site configuration and assets;
- domain registrant contacts;
- payment/transaction records;
- usage analytics and error diagnostics;
- support communications.

Do not collect Deriv passwords. Do not store card details.

## 7. Privacy requirements

- Lawful basis and privacy notice.
- Data minimization.
- Retention and deletion periods.
- Export and account closure.
- Analytics/cookie behaviour.
- Third-party processors.
- International transfers.
- Support access.
- Incident notification.
- Registrant data shared with the registrar.

Do not claim GDPR/CCPA/other compliance without review and evidence.

## 8. Secure release execution

- Never execute untrusted customer code in the control plane.
- No arbitrary generated-code execution on the shared runtime.
- Run cron jobs with least privilege and a secret-protected endpoint.
- Restrict file paths to tenant directories.
- Apply timeouts and quotas.
- Do not expose platform secrets to tenant configuration or files.
- Treat templates, modules, and dependencies as supply-chain inputs.
- Record job identity and ownership.

## 9. Shared-hosting controls

- Store secrets in cPanel environment variables, not in source or public files.
- Restrict local storage to `storage/{account_id}/` outside the web root.
- Protect the cron endpoint with `CRON_SECRET` and, where possible, IP restriction.
- Prevent path traversal and symlink escapes.
- Validate uploads and never execute them.
- Keep PostgreSQL credentials on the server and use a least-privilege DB user.
- Back up database and files; test restore.
- Monitor cPanel resource/inode limits and fail gracefully.

## 10. Verification checklist

- [ ] Cross-tenant read/write/publish/domain tests.
- [ ] Auth/recovery/2FA tests.
- [ ] Role/entitlement tests.
- [ ] Secret scanning.
- [ ] Dependency scanning.
- [ ] Rate-limit tests.
- [ ] Webhook signature/replay tests.
- [ ] Domain price/availability race tests.
- [ ] Domain contact access tests.
- [ ] No arbitrary generated-code execution.
- [ ] Backup restore exercise.
- [ ] Privileged action audit review.
