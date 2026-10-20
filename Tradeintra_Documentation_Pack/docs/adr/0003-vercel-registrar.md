# ADR 0003: Vercel Registrar for Domain Purchases

- **Status:** Superseded by ADR 0012 (Namecheap Registrar)
- **Date:** 2026-10-20
- **Superseded:** 2026-10-20

## Context

Customers must check availability, see prices, buy domains, connect domains, and renew without leaving Tradeintra. The platform also needs per-TLD markup.

## Decision

Use **Vercel Registrar** as the primary registrar behind an internal `DomainProvider` adapter.

- Public search/availability/price APIs.
- Authenticated purchase, renewal, transfer, nameserver, and contact APIs.
- Vercel DNS/SSL after assignment.
- Per-TLD markup configured by Super Admin.
- A second provider can replace Vercel without changing the customer experience.

## Alternatives

- A separate registrar with full lifecycle APIs: viable fallback, more vendor integration.
- At-cost-only registrar: conflicts with the approved markup model.
- Manual domain handling: unacceptable for self-service.

## Consequences

- One vendor for hosting and domains; simplest integration.
- Vercel does not publish an explicit reseller/markup programme; legal review is required.
- Domains are held under Tradeintra’s Vercel account/team; the customer is the registrant contact. Terms must define ownership, renewal, and transfer-out.
- TLD coverage and prices can change; always re-quote.
- Registrations are non-refundable after success.

## Security/privacy implications

- Registrant contacts are personal data; encrypt and restrict access.
- Use idempotency and `expectedPrice`.
- Do not expose registrar credentials or contact data in logs.

## Revisit trigger

Vercel terms/pricing/TLD coverage become unsuitable; a better registrar adapter is approved.
