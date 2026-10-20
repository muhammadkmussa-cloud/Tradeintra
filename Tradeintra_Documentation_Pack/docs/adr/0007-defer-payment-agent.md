# ADR 0007: Defer Payment-Agent Functionality

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

The reference product displays a 22% payment-agent/M-Pesa share. Payment-agent activity can involve processing funds for others, settlement, custody, and regulated obligations. Tradeintra has not completed legal or payment-provider review.

## Decision

Defer payment-agent functionality and the 22% share.

In scope:

- Tradeintra subscriptions;
- domain purchases/renewals;
- AI credits;
- approved marketplace/signal payments (later, with review).

Out of scope until approved:

- holding or settling customer funds;
- payment-agent deposits/withdrawals;
- the 22% share;
- assuming a payment-provider integration authorizes payment-agent activity.

## Alternatives

- Implement immediately to match DForge: unacceptable regulatory risk.
- Ignore payments entirely: blocks subscriptions and domain sales.

## Consequences

- Safer launch.
- Architecture keeps a future adapter boundary.
- Some DForge revenue features are not mirrored at launch.

## Security/privacy implications

- No custody of customer funds.
- Payment data minimized and handled by providers.
- Legal/provider review required before enabling.

## Revisit trigger

Legal, regulatory, and payment-provider review explicitly approves the model.
