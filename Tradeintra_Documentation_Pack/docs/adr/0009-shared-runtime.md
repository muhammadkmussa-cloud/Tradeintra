# ADR 0009: One Shared Runtime for Customer Applications

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Stellar Plus cannot run a separate Node.js server process for every customer application. Customers still need differently branded, differently configured published applications on separate subdomains and custom domains.

## Decision

Run **one shared Next.js/Node application** that resolves the tenant from the request hostname and renders the published configuration for that tenant.

- `tradeintra.com` serves the control plane/marketing.
- `slug.tradeintra.com` and custom domains resolve to tenant configurations.
- Publishing saves an immutable configuration version; it does not start a process.
- Tenant data is separated by `account_id` in PostgreSQL, file paths, and authorization checks.

## Alternatives

- One Node app per customer: not viable on shared hosting.
- One static build per customer: possible but operationally heavy and still needs routing.
- Separate VPS/containers: rejected by owner.

## Consequences

- Low resource usage and simple deployment.
- No per-tenant process isolation; application-level isolation is critical.
- A bad release affects all tenants.
- Wildcard/custom-domain routing and SSL must be proven on Stellar Plus.

## Security/privacy implications

- Every query, file path, and job must be tenant-scoped.
- RLS and application checks are both required.
- A tenant must never be able to influence another tenant’s configuration or assets.

## Revisit trigger

Hosting changes, or the shared runtime cannot safely serve the required tenant count.
