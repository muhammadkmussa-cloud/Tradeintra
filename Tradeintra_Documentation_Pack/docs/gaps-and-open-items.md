# Gaps and Open Items Register

**Created:** 2026-10-20  
**Purpose:** Single source of truth for every unresolved item, whether an answer/file/account has been provided, and whether it blocks the proof of concept (POC) or launch.

**Related documents:** `decision-log.md`, `open-questions.md`, `progress.md`, `known-issues.md`.

## 1. Status legend

| Status | Meaning |
|---|---|
| **Provided** | Answered, supplied, or explicitly decided |
| **Partially provided** | Direction given, but details/files/credentials are still missing |
| **Pending** | Asked, awaiting an answer |
| **Proposed** | A default exists in the docs, but the owner has not approved it |
| **Not started** | Work or dependency has not begun |
| **Not verified** | Claim/API/price needs verification against the live provider |
| **Blocked** | Waiting on an external party (Deriv, Namecheap, legal, bank) |
| **Deferred** | Intentionally out of scope for now |

## 2. Summary dashboard

| Category | Items |
|---|---:|
| Product and business | 21 |
| Legal and compliance | 13 |
| Domains and registrar | 12 |
| Stellar Plus and hosting | 24 |
| Deriv | 14 |
| Payments | 7 |
| AI | 7 |
| Security and data | 9 |
| Design and brand | 9 |
| Operations and support | 7 |
| **Total** | **123** |

| Status | Count |
|---|---:|
| Provided | 19 |
| Partially provided | 8 |
| Pending | 54 |
| Proposed | 12 |
| Not started | 16 |
| Not verified | 10 |
| Blocked | 2 |
| Deferred | 2 |
| **Total** | **123** |

## 3. Top blockers

| Gap | Status | Blocks POC? | Blocks launch? |
|---|---|---:|---:|
| Stellar Plus cPanel Node.js runtime | Not started | Yes | Yes |
| Wildcard routing/SSL | Not verified | Yes | Yes |
| Next.js build/run within shared limits | Not verified | Yes | Yes |
| PostgreSQL 10.23/Kysely compatibility | Not verified | Yes | Yes |
| cPanel addon/subdomain automation | Not verified | Yes | Yes |
| File/inode limits | Not verified | Yes | Yes |
| DB jobs + 5-minute cron | Not verified | Yes | Yes |
| Namecheap API production access/IP whitelist | Pending | No | Yes |
| Curated TLD list confirmation | Partially provided | Yes | Yes |
| Free-plan limits and revenue-share placeholders | Pending | Yes | Yes |

## 4. Product and business

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| A-01 | Full DForge feature map | Defines scope | Owner | Provided | Phased delivery confirmed 2026-10-20; `D-006` | Keep phases in roadmap | No | No | 2026-10-20 |
| A-02 | First template | Defines first build | Owner | Provided | Deriv trading site confirmed; `D-012` | Use in POC | No | No | 2026-10-20 |
| A-03 | Plan model | Defines billing | Owner | Provided | Mirror DForge free + usage-based; no monthly tiers | Document usage-based pricing | No | No | 2026-10-20 |
| A-04 | Exact plan prices/limits | Entitlements | Owner/Finance | Pending | To be shared later | Supply numbers | No | Yes | 2026-10-20 |
| A-05 | Free-plan limits | Abuse/cost/upgrade | Owner | Pending | To be shared later; placeholder 1 site/1 subdomain | Approve POC placeholder | Yes | Yes | 2026-10-20 |
| A-06 | Revenue-share percentage | Business model | Owner | Pending | “Will share later”; placeholder configurable | Supply final rate | No | Yes | 2026-10-20 |
| A-07 | Domain markup | Pricing | Owner | Provided | 15% per TLD; `D-014` | Implement config | No | No | 2026-10-20 |
| A-08 | Markup before/after tax | Checkout correctness | Finance | Pending | Not specified | Define tax order | No | Yes | 2026-10-20 |
| A-09 | Domain currency/FX | Checkout clarity | Finance | Partially provided | USD with KES conversion chosen; FX source/rounding pending | Define FX policy | No | Yes | 2026-10-20 |
| A-10 | AI credit pricing/free allowance | Monetisation/onboarding | Owner | Pending | Decide later | Set before AI phase | No | Yes | 2026-10-20 |
| A-11 | AI provider | Cost/quality/safety | Engineering | Partially provided | Provider-agnostic adapter chosen; vendor pending | Select first vendor | No | Yes | 2026-10-20 |
| A-12 | Marketplace timing/fee | Scope/revenue | Owner | Pending | Not specified | Define phase/fee | No | Yes | 2026-10-20 |
| A-13 | Signals timing/pricing | Scope/revenue | Owner | Pending | Not specified | Define trial/price | No | Yes | 2026-10-20 |
| A-14 | Referral programme | Growth | Owner | Pending | Not specified | Defer or define | No | No | 2026-10-20 |
| A-15 | Support channels | Operations | Owner | Provided | Telegram + email chosen | Set identities | No | No | 2026-10-20 |
| A-16 | Support SLA/status page | Expectations | Support | Pending | Not specified | Define SLA/status | No | Yes | 2026-10-20 |
| A-17 | Target markets/countries | Payments/legal | Owner | Pending | Not specified | Define launch markets | No | Yes | 2026-10-20 |
| A-18 | Brand asset files | UI/brand | Design | Provided | `brand/bold-t-logo.svg` and `brand/bold-t-favicon.svg` | Use in UI/favicon | No | No | 2026-10-20 |
| A-19 | Typography/wordmark approval | Brand consistency | Owner/Design | Pending | Not confirmed | Approve final assets | No | Yes | 2026-10-20 |
| A-20 | Public plan names/pricing page | Marketing | Owner | Pending | Not approved | Approve copy/prices | No | Yes | 2026-10-20 |
| A-21 | Brand color tokens differ between supplied SVGs and guidelines | Brand consistency | Owner/Design | Provided | SVGs normalized to `#FEDD00` / `#0D000A` | None | No | No | 2026-10-20 |

## 5. Legal and compliance

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| B-01 | Legal entity type | Terms/payments | Owner | Provided | Registered Kenyan company | Use entity details | No | No | 2026-10-20 |
| B-02 | Company name/registration/KRA/address | Contracts/tax | Owner | Pending | Not supplied | Provide details | No | Yes | 2026-10-20 |
| B-03 | Terms/privacy/risk disclosures | Consumer/legal | Legal | Not started | Not drafted | Draft and review | No | Yes | 2026-10-20 |
| B-04 | Domain resale/markup legal review | Namecheap terms/compliance | Legal | Not started | Not reviewed | Review before domain launch | No | Yes | 2026-10-20 |
| B-05 | Registrant ownership/transfer-out | Customer rights | Legal/Owner | Partially provided | Tradeintra account + customer contact chosen; policy pending | Define transfer-out | No | Yes | 2026-10-20 |
| B-06 | Deriv partner/legal review | Live integration | Legal | Not started | Not reviewed | Review before live | No | Yes | 2026-10-20 |
| B-07 | Target-market regulatory review | Licensing/AML | Legal | Not started | Not reviewed | Review launch markets | No | Yes | 2026-10-20 |
| B-08 | Payment-agent deferral | Regulatory risk | Owner | Provided | Deferred; `D-015`/`ADR 0007` | Keep disabled | No | No | 2026-10-20 |
| B-09 | Tax/VAT handling | Invoices/compliance | Finance | Pending | Not specified | Define VAT/tax | No | Yes | 2026-10-20 |
| B-10 | Refund/chargeback policy | Payments | Finance | Pending | Not specified | Define policy | No | Yes | 2026-10-20 |
| B-11 | Data processing/subprocessors | Privacy | Legal | Pending | Not defined | List processors/DPAs | No | Yes | 2026-10-20 |
| B-12 | Cookie/analytics policy | Privacy | Legal | Pending | Not defined | Define consent | No | Yes | 2026-10-20 |
| B-13 | Marketplace/signal seller compliance | Regulatory | Legal | Pending | Not reviewed | Review before phase | No | Yes | 2026-10-20 |

## 6. Domains and registrar

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| C-01 | Registrar | Domain lifecycle | Owner | Partially provided | Namecheap API + manual fallback; `D-019`/`ADR 0012`; production access unconfirmed | Verify API/IP whitelist | No | Yes | 2026-10-20 |
| C-02 | Curated TLD list | Customer choice | Owner | Partially provided | Proposed `.com/.org/.net/.co/.io/.app/.dev/.site/.store`; not confirmed | Confirm list | Yes | Yes | 2026-10-20 |
| C-03 | `.co.ke` support | Kenya customers | Owner | Pending | Namecheap TLD coverage not confirmed | Confirm target TLDs | No | Yes | 2026-10-20 |
| C-04 | Namecheap production API access/IP whitelist | Purchase success | Namecheap | Pending | Production access not confirmed | Verify with Namecheap | No | Yes | 2026-10-20 |
| C-05 | Namecheap API/contact schema | Implementation | Engineering | Not verified | XML API fields must be verified | Test sandbox/live | Yes | Yes | 2026-10-20 |
| C-06 | Namecheap live pricing | Checkout | Engineering | Not verified | API pricing availability unknown | Test API/price table | Yes | Yes | 2026-10-20 |
| C-07 | Domain ownership model | Customer rights | Owner/Legal | Provided | Tradeintra account + customer contact | Add to terms | No | Yes | 2026-10-20 |
| C-08 | Transfer-out/ICANN 60-day policy | Customer exit | Legal | Pending | Not defined | Define policy | No | Yes | 2026-10-20 |
| C-09 | Renewal/reminder policy | Retention | Engineering | Proposed | Docs propose 60/30/14/7/1-day reminders | Approve | No | Yes | 2026-10-20 |
| C-10 | Abuse/trademark policy | Trust/safety | Legal | Proposed | Docs propose reserved/impersonation blocks | Approve | No | Yes | 2026-10-20 |
| C-11 | Refund/credit on failed registration | Payments trust | Finance | Proposed | Docs propose refund/credit | Approve | No | Yes | 2026-10-20 |
| C-12 | FX rounding/tax display | Checkout | Finance | Pending | Not defined | Define | No | Yes | 2026-10-20 |

## 7. Stellar Plus and hosting

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| D-01 | Stellar Plus account/cPanel | Hosting base | Owner | Partially provided | Stellar Plus purchased; cPanel access not supplied | Provide cPanel access | Yes | Yes | 2026-10-20 |
| D-02 | Stellar Plus plan/billing owner | Commercial hosting | Owner | Provided | Stellar Plus confirmed | Keep billing current | No | No | 2026-10-20 |
| D-03 | Server location/resource region | Latency/limits | Engineering | Pending | Not specified | Record server location | No | Yes | 2026-10-20 |
| D-04 | Shared-hosting resource budget/limits | Capacity | Owner/Engineering | Pending | Not measured | Measure CPU/memory/inodes | Yes | Yes | 2026-10-20 |
| D-05 | cPanel Node.js app | Runtime | Engineering | Not started | None | Create app/startup/env | Yes | Yes | 2026-10-20 |
| D-06 | Shared runtime routing | Multi-tenancy | Engineering | Not started | Architecture agreed | Implement hostname resolver | Yes | Yes | 2026-10-20 |
| D-07 | `tradeintra.com` + wildcard | Tenant routing | Engineering | Not started | Not configured | Configure wildcard | Yes | Yes | 2026-10-20 |
| D-08 | cPanel/Namecheap credentials | Operations | Engineering | Not started | Not configured | Store in cPanel env | Yes | Yes | 2026-10-20 |
| D-09 | Namecheap API account/IP whitelist | Domains | Owner/Engineering | Pending | Not confirmed | Verify with Namecheap | No | Yes | 2026-10-20 |
| D-10 | PostgreSQL on Stellar Plus | Data layer | Owner/Engineering | Provided | Namecheap PostgreSQL chosen | Create DB | No | No | 2026-10-20 |
| D-11 | Auth provider | Identity | Engineering | Provided | Auth.js + DB sessions chosen | Implement | No | No | 2026-10-20 |
| D-12 | DB jobs + cPanel cron | Background work | Engineering | Provided | DB queue + 5-minute cron chosen | Implement | No | No | 2026-10-20 |
| D-13 | cPanel SMTP | Transactional email | Engineering | Provided | cPanel/Namecheap SMTP chosen | Configure | No | No | 2026-10-20 |
| D-14 | Observability | Operations | Engineering | Provided | cPanel/file logs; optional external | Configure logs | No | No | 2026-10-20 |
| D-15 | Backup/DR | Recovery | Engineering | Pending | AutoBackup + independent backups proposed | Define/test | No | Yes | 2026-10-20 |
| D-16 | PostgreSQL 10.23/Kysely compatibility | Data layer | Engineering | Not verified | Not tested | Compatibility POC | Yes | Yes | 2026-10-20 |
| D-17 | Next.js build/run within shared limits | Runtime | Engineering | Not verified | Not tested | Deploy/measure | Yes | Yes | 2026-10-20 |
| D-18 | cPanel addon/subdomain automation | Domain automation | Engineering | Not verified | cPanel API availability unknown | Test/manual fallback | Yes | Yes | 2026-10-20 |
| D-19 | Wildcard SSL coverage/renewal | HTTPS | Engineering | Not verified | AutoSSL/wildcard unknown | Test/buy cert if needed | Yes | Yes | 2026-10-20 |
| D-20 | File/inode limits | Storage | Engineering | Not verified | Limits not measured | Test quotas | Yes | Yes | 2026-10-20 |
| D-21 | Cron 5-minute/5-job behavior | Jobs | Engineering | Not verified | Not tested | Test cron tick | Yes | Yes | 2026-10-20 |
| D-22 | Namecheap API production access | Domains | Owner/Namecheap | Pending | Unconfirmed | Apply/whitelist | No | Yes | 2026-10-20 |
| D-23 | Namecheap API retail pricing | Pricing | Engineering | Not verified | Unknown | Test/price table | No | Yes | 2026-10-20 |
| D-24 | cPanel SMTP deliverability/limits | Email | Engineering | Not verified | Not tested | Test SPF/DKIM/limits | No | Yes | 2026-10-20 |

## 8. Deriv

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| E-01 | Deriv account | Live integration | Owner | Not started | No account | Create/verify account | No | Yes | 2026-10-20 |
| E-02 | Entity type | Partner/OAuth | Owner | Pending | Company vs personal not decided | Decide entity | No | Yes | 2026-10-20 |
| E-03 | Demo account | Testing | Owner | Not started | None | Create demo account | No | Yes | 2026-10-20 |
| E-04 | OAuth client ID/secret | Live auth | Deriv/Engineering | Not started | None | Register OAuth app | No | Yes | 2026-10-20 |
| E-05 | Redirect URIs | OAuth correctness | Engineering | Proposed | Local/staging/prod URIs documented | Confirm/register | No | Yes | 2026-10-20 |
| E-06 | Scopes | Least privilege | Engineering | Proposed | `trade`, `account_manage`; later `application_read` | Confirm | No | Yes | 2026-10-20 |
| E-07 | Partner application | Commission | Owner | Not started | Not applied | Apply | No | Yes | 2026-10-20 |
| E-08 | Partner approval/commission plan | Revenue | Deriv | Blocked | Not approved | Await approval | No | Yes | 2026-10-20 |
| E-09 | App markup rate/disclosure | Revenue/compliance | Owner/Legal | Pending | Not decided | Decide/disclose | No | Yes | 2026-10-20 |
| E-10 | Live integration | Trading | Engineering | Blocked | Gate not met | Implement after approval | No | Yes | 2026-10-20 |
| E-11 | DBot compatibility test | Bot claims | Engineering | Not started | No import test | Test on official Deriv | No | Yes | 2026-10-20 |
| E-12 | Standard vs custom bots | Product | Owner | Provided | Both, clearly labelled | Implement labels | No | No | 2026-10-20 |
| E-13 | Market-data licensing | Data use | Legal | Pending | Not reviewed | Review | No | Yes | 2026-10-20 |
| E-14 | Deriv legal/compliance review | Live launch | Legal | Not started | Not reviewed | Review | No | Yes | 2026-10-20 |

## 9. Payments

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | Paystack account/keys | Billing | Finance | Pending | Not supplied | Create/verify | No | Yes | 2026-10-20 |
| F-02 | M-Pesa Daraja credentials | Kenya payments | Finance | Pending | Not supplied | Create/verify | No | Yes | 2026-10-20 |
| F-03 | Payment currency | Checkout | Finance | Pending | Not specified | Define KES/USD rules | No | Yes | 2026-10-20 |
| F-04 | Billing rules | Entitlements | Owner/Finance | Partially provided | Usage-based direction; details pending | Finalize rules | No | Yes | 2026-10-20 |
| F-05 | Webhook/idempotency design | Payment integrity | Engineering | Proposed | Docs propose verified/idempotent webhooks | Implement/test | No | Yes | 2026-10-20 |
| F-06 | Payouts | Operator earnings | Owner | Deferred | Payment-agent/payout not approved | Keep disabled | No | No | 2026-10-20 |
| F-07 | Tax invoices/receipts | Compliance | Finance | Pending | Not defined | Define | No | Yes | 2026-10-20 |

## 10. AI

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | Specific AI provider | Generation | Engineering | Partially provided | Provider-agnostic adapter; vendor pending | Choose vendor | No | Yes | 2026-10-20 |
| G-02 | AI budget/quotas | Cost control | Owner | Pending | Not set | Set budgets | No | Yes | 2026-10-20 |
| G-03 | Credit pricing/free allowance | Monetisation | Owner | Pending | Decide later | Set before AI phase | No | Yes | 2026-10-20 |
| G-04 | Moderation/safety policy | Abuse/legal | Legal | Pending | Not defined | Define policy | No | Yes | 2026-10-20 |
| G-05 | Prompt/output validation | Safety | Engineering | Proposed | Docs propose validation | Implement | No | Yes | 2026-10-20 |
| G-06 | AI Builder isolation | Security | Engineering | Deferred | Arbitrary generated apps deferred (`ADR 0014`) | Revisit after hosting change | No | No | 2026-10-20 |
| G-07 | Telegram ownership/token | Signals | Engineering | Pending | Not supplied | Define ownership | No | Yes | 2026-10-20 |

## 11. Security and data

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| H-01 | Tenant isolation model | Security | Owner/Engineering | Provided | Shared Postgres + RLS chosen | Implement/test | Yes | Yes | 2026-10-20 |
| H-02 | Security review/pen test | Assurance | Engineering | Not started | Not scheduled | Schedule | No | Yes | 2026-10-20 |
| H-03 | Retention periods | Privacy | Legal | Proposed | Defaults in `data-retention-and-deletion.md` | Approve | No | Yes | 2026-10-20 |
| H-04 | Data residency | Compliance | Legal | Pending | Not defined | Define | No | Yes | 2026-10-20 |
| H-05 | Backup/restore test | Recovery | Engineering | Not started | Not tested | Test | No | Yes | 2026-10-20 |
| H-06 | Incident response/notification | Operations | Engineering | Pending | Not defined | Define | No | Yes | 2026-10-20 |
| H-07 | Vulnerability disclosure | Security | Engineering | Pending | Not defined | Define | No | Yes | 2026-10-20 |
| H-08 | Support access policy | Privacy | Support | Proposed | Least privilege proposed | Approve | No | Yes | 2026-10-20 |
| H-09 | MCP scope/token policy | Admin security | Engineering | Proposed | Scopes documented | Approve/implement | No | No | 2026-10-20 |

## 12. Design and brand

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| I-01 | Brand asset files | UI | Design | Provided | `brand/bold-t-logo.svg` and `brand/bold-t-favicon.svg` | Use in UI/favicon | No | No | 2026-10-20 |
| I-02 | Typography | UI | Design | Pending | Not confirmed | Choose/approve | No | Yes | 2026-10-20 |
| I-03 | Final logo approval | Brand | Owner | Pending | Not confirmed | Approve | No | Yes | 2026-10-20 |
| I-04 | Wordmark/domain casing | Brand | Owner | Pending | Not confirmed | Confirm | No | Yes | 2026-10-20 |
| I-05 | Accessibility target | UX | Design | Proposed | WCAG 2.2 AA proposed | Approve | No | Yes | 2026-10-20 |
| I-06 | Browser support | QA | Engineering | Pending | Not defined | Define matrix | No | Yes | 2026-10-20 |
| I-07 | Marketing copy/pricing | Launch | Owner | Pending | Not approved | Approve | No | Yes | 2026-10-20 |
| I-08 | Template visual direction | UX | Design | Pending | Not finalized | Design/approve | Yes | Yes | 2026-10-20 |
| I-09 | V1 module list | Scope | Owner | Proposed | Module catalog documented | Confirm P0 set | Yes | Yes | 2026-10-20 |

## 13. Operations and support

| ID | Gap | Why it matters | Owner | Status | Answer / evidence | Next action | POC | Launch | Updated |
|---|---|---|---|---|---|---|---|---|---|
| J-01 | Support email/Telegram identity | Customer contact | Owner | Pending | Channels chosen; addresses not supplied | Provide identities | No | Yes | 2026-10-20 |
| J-02 | SLA/hours | Expectations | Support | Pending | Not defined | Define SLA | No | Yes | 2026-10-20 |
| J-03 | Status page | Incidents | Support | Pending | Not decided | Decide | No | Yes | 2026-10-20 |
| J-04 | On-call/incident process | Reliability | Engineering | Pending | Not defined | Define | No | Yes | 2026-10-20 |
| J-05 | Staffing | Support capacity | Owner | Pending | Not defined | Plan | No | Yes | 2026-10-20 |
| J-06 | Terms/privacy pages | Launch | Legal | Pending | Not drafted | Draft/publish | No | Yes | 2026-10-20 |
| J-07 | Email templates | UX | Design/Support | Pending | Not defined | Draft | No | Yes | 2026-10-20 |

## 14. Provided decisions appendix

| Decision | Summary |
|---|---|
| D-006 | Full DForge feature map; phased delivery |
| D-007 | Deriv-only |
| D-010 | Mock Deriv first; live gated |
| D-011 | Template + brand kit + modules; no free-form builder |
| D-012 | One polished Deriv trading template first |
| D-013 | Free `slug.tradeintra.com` on the free plan |
| D-014 | Domain price = registrar cost + 15% markup, configurable per TLD |
| D-015 | Payment-agent functionality deferred |
| D-017 | Namecheap account + customer registrant contact |
| D-018 | Namecheap Stellar Plus/cPanel only; no VPS/Vercel/Neon/Redis dependency |
| D-019 | Namecheap API + manual fallback, behind a provider adapter |
| D-020 | One shared cPanel runtime; PostgreSQL; DB jobs + cron; local files |

## 15. Next questions

1. Legal company name, registration number, KRA PIN, address, and support contacts.
2. Exact plan prices, free-plan limits, and public plan names.
3. Final revenue-share percentage.
4. Tax/VAT treatment and FX rounding for KES pricing.
5. Confirmation of the curated TLD list.
6. Support email/Telegram handles, SLA, and status page.
7. Stellar Plus server location and resource limits.
8. Deriv entity choice (company vs personal) and account/partner timeline.
9. AI provider, budget, and initial credit allowance.
10. Wildcard subdomain routing and SSL result from the POC.
11. PostgreSQL 10.23/Kysely compatibility result.
12. cPanel addon/subdomain automation availability.
13. Cron 5-minute/5-job behavior and job runtime.
14. Namecheap API production access/IP whitelisting and pricing availability.

## 16. Change log

| Date | Change |
|---|---|
| 2026-10-20 | Register created from discovery decisions and outstanding questions. |
| 2026-10-20 | Brand logo/favicon assets added to `brand/`; A-18 and I-01 marked Provided; color-token mismatch added as A-21. |
| 2026-10-20 | SVG colors normalized to `#FEDD00` / `#0D000A`; A-21 marked Provided. |
| 2026-10-20 | Hosting migrated in docs to Namecheap Stellar Plus/cPanel; Vercel/Neon/Redis removed as required dependencies; hosting gaps updated. |

## Implementation evidence — 2026-10-20

A local template/brand/module/slug/publish-history slice is implemented; see `local-poc-report.md`. This does not close host, database, auth, upload, tenancy, billing, provider, or legal gaps. Domain availability is only checked against reserved names and configurations in this browser. No Namecheap/global availability claim is made. The production POC gate remains open.

## 2026-10-20 — POC preparation update

Runnable staging probes now exist for Node startup/liveness, exact-host tenant routing, pg/Kysely RLS/snapshot SQL, private files, and bounded DB cron. See `cpanel-poc-runbook.md`. Local tests are preparation evidence only. No actual host, PG-10/network, DNS/SSL, real auth, customer upload, provider, legal, or production release gap is closed.

## 2026-10-20 — Local MVP scope update

Local account/session, server draft editing, mock publication URLs, published-only reads, revision/restore behavior, local SQL isolation, and end-to-end browser journeys now have implementation/test evidence. See `mvp-delivery.md`. This closes local-development implementation gaps only, not host/production acceptance. Actual email/recovery/2FA, customer uploads, complete brand controls, real subdomains/TLS, providers, commercial entitlements, erasure/legal/ops, and the actual hosting gate remain open.
