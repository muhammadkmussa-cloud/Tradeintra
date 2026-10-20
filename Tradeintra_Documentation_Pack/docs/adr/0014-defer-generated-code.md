# ADR 0014: Defer Arbitrary Generated Code and Persistent AI Apps

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Stellar Plus cannot safely run arbitrary customer-generated applications or persistent background workers. The owner still wants a module-based application builder in v1.

## Decision

Launch the **prebuilt-module builder** only.

- Customers configure modules, brand, content, and publish a shared-runtime application.
- No unrestricted customer code.
- No per-customer Node process.
- No AI-generated standalone applications in v1.
- AI-assisted configuration may be added later if it only produces validated module configuration.
- XML bot generation and signal automation remain phased and must fit cron/request limits.

## Alternatives

- Arbitrary AI-generated apps: unsafe and incompatible with shared hosting.
- No builder: misses the core product.
- External code-execution service: not permitted as a required dependency.

## Consequences

- Safer, faster MVP.
- Less flexibility than DForge's AI Builder.
- The module system must be designed for future extension.

## Security/privacy implications

- No arbitrary code execution on the platform.
- Generated XML/config must be validated.
- AI output is untrusted input.

## Revisit trigger

Hosting changes, or a safe sandboxed execution model becomes available.
