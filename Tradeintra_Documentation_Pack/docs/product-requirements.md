# Product Requirements Document (PRD)

**Status:** Discovery complete; owner-confirmed direction. Implementation not started. Features marked `Proposed` still need delivery-level acceptance criteria.

## 1. Purpose

Define the requirements for a Deriv-only no-code studio that lets customers launch a branded trading site, generate and distribute XML bots, broadcast Telegram signals, buy or connect domains, and track earnings.

## 2. Goals

- Make the first published Deriv site achievable without code.
- Provide a curated, reliable template + brand-kit experience.
- Make subdomains and custom domains fully self-service.
- Support bots, signals, AI Builder, and marketplace as the product matures.
- Enforce strict tenant and domain isolation.
- Keep the Deriv trading boundary explicit and auditable.
- Keep hosting, registrar, and release tooling replaceable.

## 3. Non-goals

Not in scope unless separately approved:

- executing trades or holding funds;
- acting as a broker, exchange, payment agent, or investment adviser;
- guaranteeing returns;
- claiming Deriv affiliation or regulatory authorization;
- multi-broker support;
- arbitrary code in curated template sites;
- unverified market-data or broker integrations;
- the 22% payment-agent revenue share.

## 4. Personas

- **Operator/owner:** launches and brands one or more sites.
- **Bot creator:** generates, tests, and sells/distributes XML bots.
- **Signal provider:** sells or broadcasts Telegram signals.
- **End user:** visits a customer site and trades on their own Deriv account.
- **Super Admin:** controls plans, markup, templates, and platform configuration.
- **Support operator:** assists customers under least privilege.
- **AI Builder user:** deferred until a safe generated-code runtime exists.

## 5. Confirmed product decisions

| Decision                                                          | Status          |
| ----------------------------------------------------------------- | --------------- |
| Full DForge-style feature map                                     | Owner-confirmed |
| Deriv-only                                                        | Owner-confirmed |
| Namecheap Stellar Plus / cPanel only                              | Owner-confirmed |
| Namecheap Registrar API with manual fallback                      | Owner-confirmed |
| Template + brand kit + module configuration, no free-form builder | Owner-confirmed |
| One polished Deriv trading template first                         | Owner-confirmed |
| Free subdomain on free plan, fair use                             | Owner-confirmed |
| Domain price = registrar cost + configurable markup               | Owner-confirmed |
| Payment-agent feature deferred                                    | Owner-confirmed |
| Mock Deriv integration first                                      | Owner-confirmed |

## 6. Functional requirements

### 6.1 Identity and access

- **FR-AUTH-001 (Confirmed):** Register with email/password and Google.
- **FR-AUTH-002 (Confirmed):** Enforce password policy (minimum 8 characters, number, uppercase).
- **FR-AUTH-003 (Confirmed):** Email verification is required for sensitive actions.
- **FR-AUTH-004 (Confirmed):** Optional TOTP 2FA with recovery codes.
- **FR-AUTH-005 (Confirmed):** Sign in, sign out, forgot password, session expiry.
- **FR-AUTH-006 (Confirmed):** Account settings: display name, country, password, 2FA.
- **FR-AUTH-007 (Confirmed):** Account deletion with a defined grace period.
- **FR-AUTH-008 (Proposed):** Support referral codes at registration.
- **FR-AUTH-009 (Confirmed):** Server-side authorization on every protected action.

### 6.2 Deriv account linking

- **FR-DERIV-001 (Mock):** Link a Deriv account through a mock OAuth/PAT flow in development.
- **FR-DERIV-002 (Proposed):** Display linked account identifiers without exposing tokens.
- **FR-DERIV-003 (Proposed):** One Deriv account per Tradeintra account; binding requires explicit confirmation.
- **FR-DERIV-004 (Proposed):** Support re-authentication and unlink/revoke under a defined policy.
- **FR-DERIV-005 (Deferred/Live):** Live OAuth and WebSocket integration after Deriv access is approved.
- **FR-DERIV-006 (Required):** Clearly label simulated data; block live orders in mock mode.

### 6.3 Templates, brand kit, and modules

- **FR-TPL-001 (Confirmed):** Provide a template gallery with details and previews.
- **FR-TPL-002 (Confirmed):** First template is a Deriv trading site.
- **FR-TPL-003 (Confirmed):** Select a template and create a site project.
- **FR-BRAND-001 (Confirmed):** Upload logo/favicon; set brand name, colours, typography, copy, links.
- **FR-BRAND-002 (Confirmed):** Required risk disclosure cannot be removed.
- **FR-BRAND-003 (Confirmed):** Validate contrast, file type, and size.
- **FR-MOD-001 (Confirmed):** Enable/disable and configure compatible modules.
- **FR-MOD-002 (Confirmed):** Validate module compatibility and configuration server-side.
- **FR-MOD-003 (Confirmed):** Store configuration as an immutable version on publish.
- **FR-MOD-004 (Confirmed):** No arbitrary HTML/JS/server code in curated sites.
- **FR-MOD-005 (Proposed):** Layout presets and approved section toggles.

### 6.4 Sites and publishing

- **FR-SITE-001 (Confirmed):** Create, rename, archive, and delete owned sites under policy.
- **FR-SITE-002 (Confirmed):** View only authorized sites.
- **FR-SITE-003 (Confirmed):** Draft, preview, publish, and rollback.
- **FR-SITE-004 (Confirmed):** Show publish, hostname, DNS, and SSL status.
- **FR-SITE-005 (Confirmed):** Enforce plan limits (published apps, storage, AI usage).
- **FR-SITE-006 (Confirmed):** `slug.tradeintra.com` subdomain on the free plan, fair use.
- **FR-SITE-007 (Confirmed):** Reserved names and uniqueness checks.
- **FR-SITE-008 (Proposed):** Site-level announcements.
- **FR-SITE-009 (Proposed):** Custom domain attachment and verification.

### 6.5 Domain management

- **FR-DOM-001 (Confirmed):** Search a domain and show available/taken/unsupported.
- **FR-DOM-002 (Confirmed):** Show registration and renewal price before checkout.
- **FR-DOM-003 (Confirmed):** Purchase a domain inside Tradeintra via the Namecheap API, with manual fallback.
- **FR-DOM-004 (Confirmed):** Re-check price with `expectedPrice` before purchase.
- **FR-DOM-005 (Confirmed):** Collect registrant contact data with validation.
- **FR-DOM-006 (Confirmed):** Idempotent domain orders; no duplicate registrations.
- **FR-DOM-007 (Confirmed):** Connect an externally owned domain.
- **FR-DOM-008 (Confirmed):** Show DNS, verification, and SSL status.
- **FR-DOM-009 (Confirmed):** Auto-renew configuration and renewal reminders.
- **FR-DOM-010 (Confirmed):** Per-TLD markup configurable by Super Admin; default 15%.
- **FR-DOM-011 (Confirmed):** Refund/credit if paid but registration fails.
- **FR-DOM-012 (Required):** Document registrant ownership and transfer-out policy.
- **FR-DOM-013 (Required):** Block abusive/impersonating domains.

### 6.6 Publish and operations

- **FR-DEP-001 (Confirmed):** Publish creates an immutable configuration version.
- **FR-DEP-002 (Confirmed):** Publish work is durable and idempotent.
- **FR-DEP-003 (Confirmed):** Show validating/published/failed publish states.
- **FR-DEP-004 (Confirmed):** Logs are redacted and access-controlled.
- **FR-DEP-005 (Confirmed):** Rollback to a previous published version.
- **FR-DEP-006 (Confirmed):** Show a live URL only after hostname and SSL verification.
- **FR-DEP-007 (Deferred):** Arbitrary generated AI apps are deferred.
- **FR-DEP-008 (Proposed):** Publish history per site.

### 6.7 XML bots and Deriv preset library

- **FR-BOT-001 (Proposed):** Upload XML bots with validation and malware checks.
- **FR-BOT-002 (Proposed):** List, rename, describe, tag, and delete owned bots.
- **FR-BOT-003 (Proposed):** Assign bots to a site.
- **FR-BOT-004 (Deferred/Proposed):** Generate a bot from plain English or a video link only after hosting job limits are proven.
- **FR-BOT-005 (Proposed):** Verify/auto-fix generated bots; sandbox test before publish.
- **FR-BOT-006 (Proposed):** Label bots as standard DBot-compatible or Tradeintra-only.
- **FR-BOT-007 (Deferred):** Bot store/marketplace listing and sales.
- **FR-BOT-008 (Proposed):** Per-bot usage/revenue analytics.

### 6.8 AI Builder (deferred)

- **FR-AIB-001 (Deferred):** Arbitrary generated applications are deferred.
- **FR-AIB-002 (Deferred):** No generated-code runtime on Stellar Plus in v1.
- **FR-AIB-003 (Deferred):** AI may later assist with validated module configuration only.

### 6.9 AI Signals and Telegram (deferred)

- **FR-SIG-001 (Deferred):** Signal orders are deferred until cron/job capacity is proven.
- **FR-SIG-002 (Deferred):** Telegram delivery is not in the launch scope.
- **FR-SIG-003 (Deferred):** Scheduling/delivery must fit the shared-hosting job model if introduced.

### 6.10 Marketplace

- **FR-MKT-001 (Deferred):** Sell XML bots, PDFs, courses, and signal subscriptions.
- **FR-MKT-002 (Deferred):** Product pages, checkout, file delivery, and revenue split.
- **FR-MKT-003 (Deferred):** Platform fee configurable by Super Admin.
- **FR-MKT-004 (Required):** Seller identity, refund, and abuse policy.

### 6.11 Plans, billing, and entitlements

- **FR-BILL-001 (Confirmed):** Free and paid plans with server-enforced limits.
- **FR-BILL-002 (Confirmed):** Paystack + M-Pesa adapters; provider-hosted checkout where possible.
- **FR-BILL-003 (Confirmed):** Webhooks verified and idempotent.
- **FR-BILL-004 (Confirmed):** Domain purchase is a separate order type.
- **FR-BILL-005 (Removed):** AI credits and credit packs are not offered.
- **FR-BILL-006 (Confirmed):** Cancellation/failed payment/grace policy.
- **FR-BILL-007 (Deferred):** Payment-agent share.

### 6.12 Commissions and earnings

- **FR-EARN-001 (Proposed):** Commission dashboard separated into partner commission and app markup.
- **FR-EARN-002 (Proposed):** Domain, marketplace, AI credit, and referral earnings.
- **FR-EARN-003 (Proposed):** Payout method and withdrawal status.
- **FR-EARN-004 (Required):** No payout execution by the operations MCP.
- **FR-EARN-005 (Required):** Reconcile with Deriv/provider records; never fabricate amounts.

### 6.13 Admin, MCP, and support

- **FR-ADM-001 (Proposed):** Super Admin configures plans, per-TLD markup, templates, and modules.
- **FR-ADM-002 (Proposed):** Support can view limited account/site data; actions are audited.
- **FR-ADM-003 (Proposed):** Operations MCP with scoped bearer tokens.
- **FR-ADM-004 (Required):** MCP cannot execute payouts; every call is audited.
- **FR-SUP-001 (Confirmed):** Support via Telegram and email; ticket flow when implemented.
- **FR-SUP-002 (Proposed):** Help center/FAQ and status communication.

## 7. Non-functional requirements

See `non-functional-requirements.md`.

## 8. Acceptance principles

- Every protected operation is authorized server-side.
- Tenant A cannot access Tenant B’s data, files, domains, logs, or publish history.
- A publish reflects the actual state, not a frontend assumption.
- A domain is not shown active until DNS and SSL are verified.
- A failed payment never grants an entitlement.
- Simulated Deriv data is visibly labelled.
- Critical journeys have automated tests.

## 9. Open items

See `open-questions.md`. This PRD is approved for documentation and POC planning, not for full production build.
