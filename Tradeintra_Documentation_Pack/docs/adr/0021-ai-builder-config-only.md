# ADR 0021: AI Builder Is Configuration-Only

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Stellar Plus cannot safely run arbitrary generated customer code or per-customer processes. The owner selected AI Builder, but the hosting decision remains Namecheap-only.

## Decision

AI Builder may propose and validate configuration changes:

- brand name, accent, headline, description
- module toggles and validated module settings
- safe copy suggestions

It must not generate or execute arbitrary HTML, CSS, JavaScript, server code, or standalone applications.

## Consequences

- AI Builder remains useful without changing the hosting model.
- Output is schema-validated before preview or publish.
- Any future generated-app runtime requires a new ADR and hosting decision.
