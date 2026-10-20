# ADR 0018: Domain Lifecycle and Ownership

- **Status:** Accepted, subject to legal and Namecheap API review
- **Date:** 2026-10-20

## Context

Users may start on a free subdomain and later attach a custom domain. Tradeintra sells domains through Namecheap with a 15% markup.

## Decision

- Start with a platform subdomain or one custom domain.
- A subdomain can upgrade to a custom domain.
- Removing a custom domain returns the site to its subdomain.
- After removal, the user may attach a new custom domain; the new domain must pass DNS/SSL verification.
- Tradeintra's Namecheap account holds the registration; the customer is the registrant contact.
- Registration and renewal prices are stored separately with `last_verified_at`.
- Retail price = registrar cost + 15% configurable markup.
- Domain orders are idempotent and reconciled; failed registration is refunded or credited.
- Transfer-out follows the ICANN 60-day lock and outstanding-fee policy.
- TLDs: `.com`, `.org`, `.net`, `.co`, `.io`, `.app`, `.dev`, `.site`, `.store`; USD pricing with KES display.

## Consequences

- Domain attach/detach must be audited.
- DNS/SSL status is never reported as live before verification.
- Legal review is required for registrant ownership, transfer-out, refunds, and abuse.

## Revisit trigger

Namecheap API access, pricing, or registrar terms change.
