# ADR 0006: Free Tradeintra Subdomains

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Customers should be able to publish without buying a domain. The free plan needs a clear, low-friction entry point while controlling abuse and infrastructure cost.

## Decision

Free plan includes:

- one published application;
- one `slug.tradeintra.com` subdomain;
- selected modules;
- basic brand kit;
- Tradeintra branding;
- fair-use limits.

The subdomain remains available indefinitely while the account complies with the terms and fair-use policy.

## Alternatives

- Trial-only subdomain: more friction, lower conversion.
- Paid-only subdomain: conflicts with the free entry point.
- No subdomain: forces domain purchase before first publish.

## Consequences

- Fast onboarding and a clear upgrade path to custom domains.
- Requires reserved names, uniqueness, abuse controls, and reclaim policy.
- Hosting cost must be monitored per free tenant.

## Security/privacy implications

- Subdomains are routing, not isolation.
- Reserved/impersonating names must be blocked.
- Free tenants still require tenant isolation and rate limits.

## Revisit trigger

Abuse or infrastructure cost makes the free tier unsustainable.
