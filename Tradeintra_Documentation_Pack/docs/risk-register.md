# Risk Register

Assess likelihood and impact after the POC; levels below are initial qualitative estimates.

| ID | Risk | Severity | Mitigation | Status |
|---|---|---|---|---|
| R-001 | Deriv partner/OAuth access is delayed or refused | High | Mock-first development; do not make launch depend on live Deriv; prepare documentation and fallback | Open |
| R-002 | Namecheap API access/IP whitelisting is unavailable | High | Sandbox first; manual fallback; confirm production access | Open |
| R-003 | Domain registrant ownership is misunderstood | High | Clear terms, transfer-out policy, legal review | Open |
| R-004 | Stellar Plus outage/resource limits disrupt publishing | High | Status handling, cached configs, release rollback, measured limits | Open |
| R-005 | Domain price/availability changes between quote and purchase | Medium | Re-check, `expectedPrice`, price snapshot, refund/credit | Open |
| R-006 | Cross-tenant data leak | Critical | RLS, scoped queries, ownership checks, tests | Open |
| R-007 | Domain/subdomain takeover or misassignment | Critical | Verification, unique constraints, audit, abuse process | Open |
| R-008 | Generated AI app steals secrets or attacks platform | Critical | Isolation, scoped env, scanning, egress limits | Open |
| R-009 | cPanel/Namecheap credential compromise | Critical | cPanel env vars, scoped credentials, rotation, audit | Open |
| R-010 | Registrar contact data leak | High | Encryption, masking, least privilege | Open |
| R-011 | Payment webhook forgery/replay | High | Signature verification, idempotency, reconciliation | Open |
| R-012 | AI generation produces unsafe or non-compliant bots/apps | High | Validation, sandbox, review, labelling, no profit claims | Open |
| R-013 | DBot compatibility claim is false | High | Import test on official Deriv; label Tradeintra-only | Open |
| R-014 | Shared-hosting CPU/memory/inode limits cap tenant growth | High | Quotas, load tests, measured limits, upgrade path decision | Open |
| R-015 | Namecheap TLD coverage/pricing limits customer choice | Medium | Show supported TLDs; price table; manual fallback | Open |
| R-016 | Free subdomain abuse/impersonation | Medium | Reserved names, abuse policy, reclaim, rate limits | Open |
| R-017 | Payment-agent scope creep | High | Explicit deferral; legal/provider review before enabling | Open |
| R-018 | Marketplace/signal payouts create regulatory obligations | High | Defer or legal review; separate policies | Open |
| R-019 | Accessibility/mobile issues | Medium | WCAG checks, responsive tests | Open |
| R-020 | Backups cannot be restored | High | Scheduled restore exercises | Open |
| R-021 | Product claims exceed capabilities | High | Evidence-based copy, release review | Open |
| R-023 | PostgreSQL 10.23 is EOL and may constrain the data layer | High | Kysely/pg compatibility test; avoid newer SQL; plan upgrade path | Open |
| R-024 | Wildcard SSL/routing fails on shared hosting | High | POC; per-subdomain AutoSSL; wildcard certificate fallback | Open |
| R-025 | cPanel automation for addon domains/subdomains is unavailable | High | POC; manual/support-assisted fallback; document limitation | Open |
| R-026 | Cron 5-minute/5-job limit makes jobs late or impossible | High | DB queue; short idempotent jobs; monitor; defer heavy work | Open |
| R-022 | Support/admin insider misuse | High | Least privilege, audit, break-glass | Open |

Review before production and after major changes.
