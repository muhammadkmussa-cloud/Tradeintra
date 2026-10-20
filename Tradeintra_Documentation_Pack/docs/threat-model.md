# Threat Model

## 1. Assets

- User identity, sessions, and 2FA secrets.
- Deriv link tokens and account identifiers.
- cPanel/Namecheap API credentials and hosting configuration.
- Registrar credentials and registrant contact data.
- Site configurations, brand assets, and bot files.
- Custom domains, subdomains, DNS, and SSL state.
- Publish logs, cron logs, and local files.
- Payment, subscription, and payout records.
- Commission/earnings records.
- Support/admin access.
- End-user data on published sites.

## 2. Trust boundaries

1. Public browser ↔ Tradeintra control plane.
2. Control plane ↔ PostgreSQL and local storage.
3. Control plane ↔ cPanel/Namecheap domain and DNS services.
4. Control plane ↔ Namecheap Registrar API.
5. Control plane ↔ payment providers.
6. Control plane ↔ Deriv OAuth/API.
7. Control plane ↔ AI providers.
8. Control plane ↔ Telegram.
9. Control plane ↔ cPanel cron jobs.
10. Support/admin tools ↔ customer data.
11. Multi-tenant renderer ↔ tenant configuration/assets.

## 3. Primary abuse cases

| Threat | Impact | Baseline mitigation |
|---|---|---|
| Change site/domain/publish ID to access another tenant | Data breach | Server-side ownership checks, RLS, scoped queries, tests |
| Attach another tenant’s domain | Traffic hijack | Ownership verification, unique constraints, audit |
| Buy a domain with a forged price | Financial loss | `expectedPrice`, server-side quote, price snapshot |
| Replay domain purchase | Duplicate charges/registrations | Idempotency keys, order state machine |
| Leak registrar contacts | Privacy breach | Encryption, masking, role restriction |
| Steal cPanel/Namecheap credentials | Infrastructure/domain takeover | Secret manager/env vars, least privilege, rotation, audit |
| Leak Deriv token/OTP | Account compromise | Encryption, redaction, no browser/config exposure |
| Tenant file/route traversal | Data breach | Path validation, tenant storage roots, authorization checks |
| Forge payment webhook | Fraudulent entitlement | Signature verification, idempotency, reconciliation |
| Spam domain searches/publishes | Cost/availability abuse | Rate limits, quotas, concurrency caps |
| Squat/impersonate a subdomain | Brand abuse | Reserved names, abuse policy, reclaim process |
| Prompt injection in AI generation | Unsafe code/data exfiltration | Input isolation, output validation, sandboxing |
| Compromise a template/module | Supply-chain compromise | Review, versioning, scanning, provenance |
| Abuse support privilege | Data exposure | Least privilege, time-bound access, audit |
| Simulated data presented as live | User harm/regulatory risk | Persistent labels, feature flags, tests |

## 4. Review cadence

Review before production, after major architecture changes, after adding live financial integrations or generated-code execution, and after security incidents.
