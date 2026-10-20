# ADR 0002: Vercel-First Hosting

- **Status:** Superseded by ADR 0008 (Namecheap Stellar Plus)
- **Date:** 2026-10-20
- **Superseded:** 2026-10-20

## Context

Tradeintra needs one platform for the control plane, wildcard customer subdomains, custom domains, automatic SSL, preview deployments, and deployments of generated apps. The reference product runs on Next.js/Vercel, and the team wants the easiest path to a secure MVP.

## Decision

Use **Vercel Pro only** for launch:

- Next.js control plane;
- one multi-tenant renderer;
- `*.tradeintra.com` wildcard routing;
- Vercel Domains API for custom domains;
- Vercel DNS and automatic SSL;
- Vercel Blob for assets;
- separate Vercel projects for AI-generated apps.

No second edge/CDN provider is part of the launch plan.

## Alternatives

- Self-managed cloud infrastructure: more control, much higher operational cost.
- A separate CDN/DNS provider in front of Vercel: adds proxy/SSL complexity without a launch requirement.
- Per-customer Vercel projects for curated sites: stronger isolation but slower and more expensive than a multi-tenant renderer.

## Consequences

- Fastest path to a working, secure MVP.
- Strong framework/multi-tenant support and reference precedent.
- Vendor dependency and usage-based costs; mitigate with quotas, monitoring, and provider adapters.
- Generated apps must be isolated in separate projects.

## Security/privacy implications

- Subdomains are not a security boundary; enforce tenant isolation in Postgres/RLS and application queries.
- Scope Vercel tokens to the minimum permissions.
- Generated apps must not receive platform secrets.

## Revisit trigger

Cost, limits, runtime constraints, or isolation requirements make Vercel unsuitable; or the POC fails.
