# ADR 0020: Marketplace and Signal Provider Payouts

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Sellers may list bots, PDFs, courses, and signal subscriptions. Signal providers deliver Telegram signals. Tradeintra keeps 15%; providers receive 85%.

## Decision

- A verified User may apply to become a seller or signal provider.
- The first payout requires manual Finance review.
- Platform fee: 15%; provider share: 85%.
- Marketplace funds become payable after a 7-day refund window.
- Minimum payout: $10 equivalent.
- Payout methods: M-Pesa, bank, crypto.
- Refunds/chargebacks reduce future earnings; negative balances block payouts.
- No automated payout through MCP.
- Signal trial: 24 hours, one per verified account; subscription $8.99/30 days.
- Providers connect their own Telegram bot/channel; tokens are encrypted.
- Suspended sellers/providers cannot list or receive payouts.

## Consequences

- Seller/provider onboarding, KYC/manual review, tax, and payout operations are required.
- Ledger and payout states must be auditable.
- Marketplace file delivery must be tenant-scoped and secure.
