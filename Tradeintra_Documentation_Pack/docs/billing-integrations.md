# Billing and External Integrations

**Status:** Proposed. Pricing is not final except where explicitly marked. Payment-agent functionality is deferred.

## 1. Revenue streams

| Stream | Status | Notes |
|---|---|---|
| Plan subscriptions | Proposed | Free/paid plans, server-enforced entitlements |
| Domain sales | Confirmed | Registrar cost + configurable markup |
| AI Bot Generator credits | Proposed | Credit packs, per-action costs |
| AI Builder top-ups | Deferred | Requires a safe generated-code runtime |
| Marketplace commission | Deferred | Configurable platform fee |
| Signal subscriptions | Deferred | Requires proven cron/job capacity |
| Deriv partner commission | Deferred (live gate) | Requires Deriv partner approval |
| App markup | Deferred (live gate) | Up to 3%; affects user payout |
| Payment-agent share | Deferred | Do not implement the 22% share |

## 2. Plans

### Free

- one published application;
- one `slug.tradeintra.com` subdomain;
- selected modules;
- basic brand kit;
- Tradeintra branding;
- fair-use limits;
- no custom domain.

### Paid (proposed tiers)

- custom domain;
- more published applications;
- premium modules/templates;
- higher storage and AI limits;
- branding removal;
- priority support;
- more published sites.

Plan names, prices, and limits require owner approval. Do not publish prices until approved.

## 3. Domain pricing

- Base price = current Namecheap registration/renewal price, or the Super Admin price table when the API does not return pricing.
- Retail price = base + Super Admin markup + taxes/fees.
- Markup configurable per TLD and term.
- Show registration and renewal separately.
- Store the price snapshot with the order.
- Registrar fees are non-refundable after successful registration.
- If a paid registration fails, refund or credit.

See `domain-management.md`.

## 4. AI credits

- Credits are purchased in packs (prices to be approved).
- Costs are deducted before an AI action.
- Failed actions may be refunded by policy.
- Credits have no cash value and are not transferable.
- Track every debit/credit in `CreditLedger`.
- Enforce concurrency and daily limits.

Reference-observed DForge costs (for comparison only, not Tradeintra pricing): 13 credits per generate+verify run; 30/$4.99, 65/$9.99, 150/$19.99.

## 5. Payments

### Providers

- Paystack for cards and supported mobile money.
- M-Pesa/Daraja for Kenya.
- Additional providers only after review.

### Rules

- Use provider-hosted checkout/portal where possible.
- Never store raw card data.
- Verify webhook signatures.
- Store the raw event and process idempotently.
- Grant entitlements only from trusted server state.
- A browser redirect alone never grants access.
- Keep a clear audit trail.

### Payment states

`pending → succeeded → refunded/partially_refunded`
`pending → failed`

## 6. Subscriptions

- Trial, active, past_due, cancelled, expired states.
- Define grace period for failed payments.
- Define upgrade/downgrade proration.
- Define cancellation at period end.
- Send receipts and renewal reminders.
- Reconcile with provider records.

## 7. Domain orders

A domain order is separate from a subscription:

- purpose = `domain`;
- includes registrar cost, markup, tax, term, contact snapshot;
- idempotency key;
- provider order ID;
- refund/credit path;
- no entitlement until registration succeeds.

## 8. Marketplace (deferred)

- Sellers list XML bots, PDFs, courses, and signal subscriptions.
- Platform fee configurable; reference DForge terms mention 15% after provider fees.
- Seller identity, payout, refund, and abuse policy required.
- File delivery must be secure and tenant-scoped.
- Do not enable until tax, consumer-protection, and payout obligations are reviewed.

## 9. Signals (deferred)

- Free trial, then a recurring subscription.
- Reference-observed DForge price: $8.99/30 days after a 60-minute trial.
- Card auto-renew; M-Pesa/crypto may be one period.
- Cancel stops future renewals; access continues to period end.
- Failed payment pauses the bot; removal policy must be defined.

## 10. Commissions

Keep ledgers separate:

- Deriv partner commission;
- app markup;
- domain sales;
- AI credits;
- marketplace;
- signals;
- referrals.

Do not net them into one unexplained balance. Show source, period, status, and provider reference.

## 11. Payouts

- Payout methods: M-Pesa, bank, crypto (subject to approval).
- Payout requests are reviewed by Finance.
- Payout execution is outside the operations MCP.
- Reconcile with provider statements.
- Never pay from an unsettled estimate.

## 12. Integration inventory

| Integration | Purpose | Status |
|---|---|---|
| Namecheap Stellar Plus | Hosting, PostgreSQL, files, email, cron, SSL | Confirmed |
| Namecheap API | Domain lifecycle | Confirmed direction; API access unverified |
| PostgreSQL (Stellar Plus) | Database | Confirmed |
| DB jobs + cPanel cron | Background work | Confirmed |
| Auth.js | Auth + DB sessions | Proposed |
| cPanel SMTP | Transactional email | Proposed |
| Paystack | Cards/mobile money | Proposed |
| M-Pesa/Daraja | Kenya payments | Proposed |
| Telegram | Signal delivery | Deferred |
| Deriv | OAuth/API/trading | Mock only |
| AI provider | Optional bot/config assistance | Optional |
| File logs / cPanel logs | Monitoring | Confirmed |

For each integration record: owner, scopes, data exchanged, secrets, sandbox, costs, rate limits, webhooks, retry, retention, and compliance.

## 13. Refund policy

- Subscriptions: per approved plan terms.
- Domain registrations: non-refundable after success; refund/credit if Tradeintra fails to deliver.
- AI credits: per approved policy; unused credits may be non-refundable.
- Marketplace/signals: separate policy.

## 14. Acceptance criteria

- [ ] Entitlements are enforced server-side.
- [ ] Webhooks are signed and idempotent.
- [ ] A redirect cannot grant paid access.
- [ ] Domain orders reconcile with payments.
- [ ] AI credit ledger balances.
- [ ] Payouts are not executed by MCP.
- [ ] Prices shown to users match the approved rules.
