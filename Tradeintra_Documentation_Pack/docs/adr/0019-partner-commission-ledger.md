# ADR 0019: 15% Partner-Commission Ledger

- **Status:** Accepted, subject to Deriv partner access
- **Date:** 2026-10-20

## Context

Tradeintra earns 15% of the Deriv partner commission attributed to a customer site. Deriv partner/OAuth access is still being applied for.

## Decision

Maintain a separate platform commission ledger:

- One row per site/trader/period with gross partner commission, platform share (15%), status, and provider reference.
- Statuses: `estimated`, `imported`, `settled`, `reversed`.
- Until the Deriv API is available, support a controlled CSV/manual import and clearly label estimates.
- Never present estimated commission as settled or payable.
- Do not charge users directly for this 15% share.
- Keep partner commission separate from app markup, domain sales, AI credits, marketplace, signals, and referrals.

## Consequences

- Finance can reconcile without waiting for API access.
- The ledger must be audited and immutable after settlement.
- No MCP payout execution.

## Revisit trigger

Deriv partner API access is approved or commission terms change.
