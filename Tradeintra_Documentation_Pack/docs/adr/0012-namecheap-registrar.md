# ADR 0012: Namecheap Registrar Adapter

- **Status:** Accepted, subject to API access verification
- **Date:** 2026-10-20
- **Supersedes:** ADR 0003

## Context

Tradeintra must sell and manage domains inside the platform using Namecheap, with a manual fallback. Production API access and IPv4 whitelisting are not yet confirmed.

## Decision

Implement a `DomainProvider` service backed by the **Namecheap API**:

- Sandbox/test first.
- Production only after API access and IPv4 whitelisting are confirmed.
- Manual/support-assisted registration fallback.
- API pricing when available; Super Admin price table fallback.
- Store registration and renewal prices separately with `last_verified_at`.
- Reconcile final charges; require customer confirmation if the final price differs.
- Use Namecheap DNS + cPanel addon domains + AutoSSL/wildcard certificate.

## Alternatives

- Manual-only domains: poor customer experience.
- Vercel Registrar: removed with Vercel hosting.
- Another registrar: not aligned with the Namecheap-only direction.

## Consequences

- One vendor for hosting and domains.
- API access, IP whitelisting, account balance, and pricing limitations must be handled.
- Domain ownership/registrant policy and markup require legal review.

## Security/privacy implications

- API credentials stored in cPanel environment variables.
- Registrant contact data encrypted and access-controlled.
- Domain orders are idempotent and audited.

## Revisit trigger

Namecheap API access is refused, or its terms/pricing no longer fit.
