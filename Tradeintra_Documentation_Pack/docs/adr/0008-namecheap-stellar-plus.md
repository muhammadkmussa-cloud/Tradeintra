# ADR 0008: Namecheap Stellar Plus as Mandatory Hosting

- **Status:** Accepted
- **Date:** 2026-10-20
- **Supersedes:** ADR 0002

## Context

The owner has confirmed that Tradeintra must run on Namecheap Stellar Plus shared hosting with cPanel. A VPS, Vercel, or another external hosting/database provider must not be a required dependency. Stellar Plus provides a cPanel Node.js application environment, PostgreSQL, local file storage, cron, email, DNS, and domains, but has shared-hosting limits.

## Decision

Use **Namecheap Stellar Plus / cPanel only** for production hosting:

- Next.js/React application through cPanel's Node.js application environment.
- PostgreSQL on Stellar Plus.
- Local file storage in the hosting account.
- DB-backed jobs processed by cPanel cron.
- Namecheap API for domains, with manual fallback.
- cPanel/Namecheap DNS, subdomains, addon domains, SSL, and SMTP.
- No Redis, Docker, persistent worker daemon, per-tenant Node process, or Vercel/Neon/Supabase dependency.

## Alternatives

- Vercel + managed Postgres/Redis: rejected by owner.
- Namecheap VPS: rejected by owner.
- External managed database/storage: not permitted as required dependencies.

## Consequences

- Much lower infrastructure cost and one vendor.
- Shared CPU/memory/inode limits, 5-minute cron minimum, no persistent workers.
- No Vercel previews, edge CDN, or instant rollbacks.
- PostgreSQL 10.23 is old and must be compatibility-tested.
- Wildcard subdomain/SSL and cPanel automation must be proven on the actual account.

## Security/privacy implications

- Shared hosting requires strict file permissions, secret storage in cPanel env vars, and cron endpoint protection.
- Tenant isolation must be enforced in the application and database, not by subdomains.
- Backups must include database, files, and configuration.

## Revisit trigger

The POC proves a hard hosting limitation that cannot be worked around, or the owner explicitly changes the hosting decision.
