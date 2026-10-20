# ADR 0016: DeepSeek as the AI Provider for Bots

- **Status:** Accepted, subject to API key and safety review
- **Date:** 2026-10-20

## Context

The platform needs bounded AI assistance for XML bot generation, refinement, and verification. The owner selected DeepSeek.

## Decision

Use DeepSeek behind an `AiProvider` adapter:

- `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`.
- Mock mode returns deterministic XML fixtures; sandbox/live modes call DeepSeek only server-side.
- AI work runs as a bounded DB job, never in a request that can exceed cron limits.
- Credits are debited before generation: generate 10, refine 3, verify 3.
- Every generated bot is validated, labelled standard DBot or Tradeintra-only, and sandbox-tested where possible.
- No generated code runs on the platform; XML is data.
- AI Builder is configuration-only (ADR 0021).

## Consequences

- Provider latency, cost, output safety, and data handling must be tested.
- The platform must bound prompt size, output size, retries, and spend.
- API keys stay in cPanel environment variables and are never logged.

## Revisit trigger

DeepSeek quality, cost, availability, or data terms fail the launch review.
