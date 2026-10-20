# ADR 0005: Mock Deriv Integration First

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Tradeintra has no Deriv account or approved partner/OAuth access yet. The product must be developable and demonstrable without real trading credentials.

## Decision

Build a `DerivProvider` interface with:

- `mock` implementation for development, demos, and tests;
- `live` implementation gated by server-side approval.

Mock mode includes mock OAuth, fixture accounts, market data, proposals, and deterministic success/failure cases. It never calls Deriv or creates real orders. Simulated data is visibly labelled.

## Alternatives

- Wait for Deriv access before building: blocks progress.
- Use real Deriv credentials during development: unnecessary risk and dependency.
- Scrape public data: not sufficient for authenticated flows.

## Consequences

- Development can proceed immediately.
- The live integration must be tested separately before launch.
- Mock/live separation must be enforced in configuration and UI.

## Security/privacy implications

- No real tokens in mock mode.
- Mock mode must be impossible to enable for production end users.
- Public market data use must follow Deriv’s terms.

## Revisit trigger

Deriv account/partner/OAuth approval is obtained and the live checklist passes.
