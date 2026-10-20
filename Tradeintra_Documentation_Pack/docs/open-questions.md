# Open Questions and Owner Decisions

**Status source of truth:** `gaps-and-open-items.md` tracks every gap, owner, and whether an answer/file/account has been provided. This file keeps the detailed question text.

| ID | Question | Why it matters | Status |
|---|---|---|---|
| OQ-001 | What can customers create? | Defines architecture | Resolved: Deriv trading sites, XML bots, module-based applications; AI-generated apps deferred |
| OQ-002 | Does DForge generate code, config, or hosted apps? | Builder/deployment model | Resolved: template/config sites, bots/apps; Tradeintra uses a shared runtime |
| OQ-003 | Which templates/customization controls? | Core UI/schema | Resolved: one Deriv template + brand kit + modules |
| OQ-004 | Live trading or interfaces/simulation? | Risk/integration | Resolved: no Tradeintra execution; Deriv trades; mock first |
| OQ-005 | Hosting provider? | Requirements | Resolved: Namecheap Stellar Plus/cPanel only |
| OQ-006 | Custom domains? | DNS/TLS scope | Resolved: Namecheap API; cPanel addon domains; manual fallback |
| OQ-007 | Pricing/usage limits? | Billing | Partially resolved: domain cost+markup, free subdomain; plan prices pending |
| OQ-008 | First-release features? | Scope/cost | Resolved: accounts → module builder → subdomain publish → mock Deriv; domains/billing next |
| OQ-009 | Collaborators? | Workspace/permissions | Not observed; deferred |
| OQ-010 | Existing stack? | Avoid rewrite | Resolved: no app yet; Next.js/React on cPanel Node.js |
| OQ-011 | Hosting budget/constraints? | Infrastructure | Resolved: Stellar Plus mandatory; resource limits need measurement |
| OQ-012 | Countries/markets? | Payments/privacy/compliance | Open |
| OQ-013 | Market-data/broker integrations? | Licensing/security | Deriv only; live gated |
| OQ-014 | Billing required at launch? | Entitlements | Yes for plans/domains/credits; provider details pending |
| OQ-015 | Logo artwork? | Brand | Assets supplied; final typography/wordmark approval pending |
| OQ-016 | Support channel/hours? | Operations | Telegram/email first; SLA/ticket flow pending |
| OQ-017 | Does Namecheap permit the resale/markup model? | Legal/business | Open — legal/terms review required |
| OQ-018 | Who is the registrant: Tradeintra or customer? | Ownership/terms | Proposed Tradeintra account + customer contact; legal review |
| OQ-019 | What are the per-TLD markup values? | Pricing | Default 15%; per-TLD values pending |
| OQ-020 | What is the free-plan fair-use limit? | Cost/abuse | Open |
| OQ-021 | What is the paid-plan structure? | Business model | Usage-based mirror of DForge; exact prices pending |
| OQ-022 | When will the Deriv account/partner/OAuth be created? | Live integration | Open — no account yet |
| OQ-023 | Which AI provider(s)? | Cost/quality/safety | Optional; provider-agnostic; vendor pending |
| OQ-024 | Which payment providers at launch? | Billing | Proposed Paystack + M-Pesa |
| OQ-025 | Which marketplace/signals phases? | Scope | Deferred/phase 2+ |
| OQ-026 | What is the domain transfer-out policy? | Customer rights | Open |
| OQ-027 | What is the tax/VAT handling? | Billing/compliance | Open |
| OQ-028 | What are the retention periods? | Privacy/ops | Proposed defaults; approval pending |
| OQ-029 | What is the support SLA? | Operations | Open |
| OQ-030 | What is the incident/status communication channel? | Operations | Open |
| OQ-031 | Does the cPanel Node app receive wildcard subdomain traffic? | Shared runtime | Must be proven in POC |
| OQ-032 | Does AutoSSL cover `*.tradeintra.com`, or is a wildcard certificate required? | HTTPS | Must be proven in POC |
| OQ-033 | Can addon domains/subdomains be automated via cPanel API? | Domain automation | Must be proven; manual fallback |
| OQ-034 | Does Kysely/pg work with PostgreSQL 10.23? | Data layer | Must be compatibility-tested |
| OQ-035 | Can Next.js build/run within Stellar Plus CPU/memory limits? | Runtime | Must be measured |
| OQ-036 | What are the disk/inode limits for tenant files? | Storage | Must be measured |
| OQ-037 | Does the Namecheap API return retail pricing? | Domain pricing | Must be tested; table fallback |
| OQ-038 | Is production Namecheap API access/IP whitelisting available? | Domain automation | Unconfirmed |
| OQ-039 | Does cPanel SMTP meet deliverability/volume needs? | Email | Must be tested; provider interface |
| OQ-040 | How many tenants can the shared runtime support? | Capacity | Measure in POC; do not promise a number |

Do not block the POC on questions answerable by building a small test. Do not make high-impact assumptions silently.

## 2026-10-20 — Questions before production POC

- Which owner-approved cPanel test application/domain and supported Node version can be used?
- What PostgreSQL version, least-privilege DB role, memory/process limit, wildcard SSL setup, and cron quotas are actually available?
- Which sample domains and test tenants may be provisioned after explicit approval?
- How will auth/email and tenant isolation be verified before replacing browser-local storage?

The local UI needs no credentials. Any hosting credentials must be provided through a secure environment, never committed or pasted into chat.

## 2026-10-20 — Staging execution inputs still required

- Is there an owner-approved staging cPanel app using Node 22.15+ and a private application directory?
- Can the dedicated staging PostgreSQL role create/own the POC schema while remaining non-superuser and without BYPASSRLS? What actual server version and TLS configuration apply?
- Which three exact test subdomains and custom-domain alias are approved, and does Passenger preserve Host?
- Which private storage/log paths and cron runtime are approved?

Supply configuration through cPanel or a protected environment file, not chat or committed files. No credentials are needed to continue using the local studio.

## 2026-10-20 — After local MVP completion

- Which approved staging environment will execute both the original POC and the new account schema checks? Configure access securely; no credentials should be shared in chat.
- What production auth/email/recovery/2FA and abuse policy is approved after the actual host and security review? The local/staging auth is deliberately limited.
- What legal retention/erasure schedule and backup/restore process applies to account credentials, archived sites, and immutable histories?
- Which production brand controls (uploads/typography/contact) and commercial plan limits are approved for the next acceptance slice?

No answer is required to run and test the delivered local mock MVP; none of these is silently treated as approved.
