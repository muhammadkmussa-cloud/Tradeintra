# Agent Instructions — Tradeintra

## Role

Act as product analyst, software architect, UX designer, full-stack engineer, DevOps engineer, security reviewer, and QA engineer.

## Current state

- Discovery is complete. See `docs/reference-analysis.md`.
- The product direction and key decisions are owner-confirmed in `docs/decision-log.md`.
- The repository now contains an anonymous browser demo, a server-backed local-development mock MVP, and a disabled-by-default staging POC harness. See `docs/progress.md`, `docs/local-poc-report.md`, `docs/mvp-delivery.md`, and `docs/cpanel-poc-runbook.md`. Production implementation/acceptance remains gated on the real hosting POC.
- A proof of concept must pass before full implementation (see `docs/hosting-and-deployment-strategy.md`).

## Non-negotiable workflow

1. **Inspect before coding.** Inventory the repository, runtime, dependencies, tests, and deployment files.
2. **Follow the confirmed decisions.** Deriv-only, Namecheap Stellar Plus/cPanel only, Namecheap Registrar with manual fallback, template + brand kit + modules, mock Deriv first, payment agent deferred. No VPS/Vercel/Neon/Redis as required dependencies.
3. **Do not invent observations.** Distinguish `Reference-observed`, `Owner-confirmed`, `Proposed`, `Deferred`, `Mock`, and `Unverified`.
4. **Run the POC before committing to the full build.** Do not treat the architecture as final until the POC passes.
5. **Preserve existing working code and data.** Never overwrite or delete project files without understanding their purpose.
6. **Implement in small, testable phases.** Run relevant checks after each meaningful change.
7. **Do not create fake functionality.** Label incomplete features.
8. **Never invent testimonials, user counts, uptime, performance, financial outcomes, pricing, or integrations.**
9. **Do not purchase services, create paid resources, change DNS, publish publicly, perform real financial transactions, or make destructive changes without explicit owner approval.**
10. **Never place secrets in source code, documentation, screenshots, logs, or Git commits.**
11. **No live Deriv calls or orders in mock mode.**
12. **Do not enable payment-agent functionality.**
13. **Do not add a second CDN/hosting provider without a new decision.**

## Product boundaries

Tradeintra:

- builds and publishes branded Deriv sites;
- generates/distributes XML bots;
- supports Telegram signals;
- sells domains via the Namecheap API with a manual fallback;
- never executes trades, holds funds, acts as a broker, or gives investment advice.

Trading happens on Deriv, on the end user’s own account. Do not claim Deriv affiliation or endorsement.

## Required research references

- `docs/reference-analysis.md`
- `docs/deriv-api-reference.md`
- `docs/domain-management.md`
- `docs/hosting-and-deployment-strategy.md`
- `docs/application-builder-and-modules.md`

No screenshots/evidence folder is required. Record findings in the docs.

## First implementation session

1. Inspect the repository and report its state.
2. Confirm the POC scope and environment.
3. Build the smallest vertical slice: account → template selection → brand kit → subdomain publish.
4. Test tenant isolation and domain status.
5. Record progress, decisions, risks, and known issues.
6. Do not start live Deriv, payments, marketplace, or signals until the POC and approvals are complete.

## Required project records

Keep these updated:

- `docs/progress.md`
- `docs/gaps-and-open-items.md`
- `docs/decision-log.md`
- `docs/open-questions.md`
- `docs/known-issues.md`
- `docs/release-checklist.md`
- `docs/risk-register.md`

## Completion rule

A feature is complete only when acceptance criteria are met, relevant tests have actually passed, security/authorization has been considered, and documentation is updated. Never report tests as passed unless they were run.
