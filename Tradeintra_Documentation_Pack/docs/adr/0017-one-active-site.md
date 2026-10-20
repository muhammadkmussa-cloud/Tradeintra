# ADR 0017: One Active Site per Account

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

The owner wants each account to operate one branded site. The existing development MVP allows five active sites and twenty lifetime sites.

## Decision

Enforce **one non-archived site per account**:

- Application checks and a DB partial unique index.
- Archiving or deleting the active site releases the slot.
- The user may then create a replacement site.
- Immutable history remains private according to retention policy.
- Existing accounts with multiple active sites must archive down to one before creating another; the migration does not silently delete sites.

## Consequences

- Simpler plan, domain, and billing model.
- Migrations and tests must handle pre-existing multi-site accounts.
- Admin/support needs an audited replacement workflow.

## Revisit trigger

Paid plans or team accounts require multiple sites.
