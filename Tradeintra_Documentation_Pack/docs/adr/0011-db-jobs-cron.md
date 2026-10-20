# ADR 0011: Database Jobs + cPanel Cron (No Redis)

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Stellar Plus does not provide a managed Redis service, and persistent background daemons are not permitted. Namecheap shared hosting allows cron jobs but not intervals below 5 minutes or more than 5 simultaneous cron jobs.

## Decision

Use a **PostgreSQL-backed job queue** processed by a protected cPanel cron tick every 5 minutes.

- `jobs` table with type, payload, status, `run_after`, `locked_at`, attempts, and idempotency key.
- Cron calls a protected internal endpoint or CLI runner.
- Jobs are short, bounded, idempotent, and retry-safe.
- No Redis, no persistent worker daemon, no long-running AI generation.

## Alternatives

- Redis/BullMQ: not available without an external service.
- Always-on worker process: prohibited on shared hosting.
- Request-bound background work: unreliable and timeout-prone.

## Consequences

- Simple, durable, and cheap.
- Jobs may run up to 5 minutes late.
- Long tasks must be split into idempotent steps.
- Cron monitoring and stuck-job detection are required.

## Security/privacy implications

- The cron endpoint requires a secret and/or IP restriction.
- Jobs re-check tenant ownership before acting.
- Job logs must be redacted.

## Revisit trigger

Hosting changes, or job volume/latency exceeds what a 5-minute cron can support.
