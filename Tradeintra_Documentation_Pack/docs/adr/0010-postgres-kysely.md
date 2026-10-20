# ADR 0010: PostgreSQL on Stellar Plus with Kysely + pg

- **Status:** Accepted, subject to compatibility testing
- **Date:** 2026-10-20

## Context

Stellar Plus provides PostgreSQL 10.23. Modern ORMs may assume newer server features. Production data must remain on Namecheap.

## Decision

Use **PostgreSQL on Stellar Plus** with **Kysely + `pg`** as the preferred data layer, subject to testing migrations, transactions, auth queries, JSONB, RLS, and tenant isolation against the actual server.

- Use application-generated UUIDs if a suitable UUID extension is unavailable.
- Avoid PostgreSQL features newer than 10.
- Run migrations through a controlled CLI/SSH process, not automatically on web requests.
- Document any version-related limitation.

## Alternatives

- Prisma: retain only if compatibility with the available PostgreSQL version is proven.
- MariaDB/MySQL: evaluate only if PostgreSQL compatibility blocks the build.
- Neon/Supabase: not permitted as required production dependencies.

## Consequences

- SQL-first, lightweight, and compatible with older PostgreSQL.
- More hand-written SQL/migration work than a full ORM.
- PostgreSQL 10.23 is EOL; security and upgrade risk must be documented.

## Security/privacy implications

- RLS and tenant-scoped queries are required.
- Database credentials stay in cPanel environment variables.
- Backups must include the database and be tested.

## Revisit trigger

Compatibility testing fails, or Namecheap upgrades PostgreSQL.
