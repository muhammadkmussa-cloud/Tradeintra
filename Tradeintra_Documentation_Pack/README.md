# Tradeintra — Project Documentation Pack

**Product:** Tradeintra  
**Domain:** `https://Tradeintra.com`  
**Reference product:** `https://dforge.site/sites`  
**Tagline:** Build. Deploy. Trade.  
**Status:** Discovery complete; direction approved; implementation not started.

## Purpose

This pack is the working documentation set for Tradeintra, a **Deriv-only no-code operator studio**. Customers launch a branded Deriv trading site from a ready-made template, apply their brand, enable modules, choose a free subdomain or custom domain, and publish. The roadmap also covers DBot XML bots, signals, marketplace, commissions, and earnings; arbitrary AI-generated applications are deferred.

## Confirmed direction

- Full DForge-style feature map.
- Deriv-only.
- Namecheap Stellar Plus shared hosting with cPanel only.
- Namecheap Registrar API for domains, with manual fallback.
- Template + brand kit + module configuration; no free-form builder.
- One polished Deriv trading template first.
- Free `slug.tradeintra.com` subdomain on the free plan, fair use.
- Domain price = registrar cost + configurable markup.
- Payment-agent functionality deferred.
- Mock Deriv integration first.

## Important boundaries

- Tradeintra does **not** execute trades, hold funds, act as a broker, or provide investment advice.
- Trading happens on Deriv, on the end user’s own account.
- Live Deriv integration is gated on account/partner/OAuth approval.
- Payment-agent functionality and the 22% share are not approved.
- Domain resale/markup requires legal/terms review.
- No VPS, Vercel, Neon, Supabase, Redis, or external hosting/database provider is a required dependency.

## Start here

1. Read `AGENT_INSTRUCTIONS.md`.
2. Read `docs/project-brief.md` and `docs/product-requirements.md`.
3. Read `docs/hosting-and-deployment-strategy.md` and `docs/domain-management.md`.
4. Read `docs/application-builder-and-modules.md`.
5. Read `docs/deriv-api-reference.md`.
6. Review `docs/reference-analysis.md` for what was observed in DForge.
7. Review `docs/gaps-and-open-items.md` for every unresolved item and its status.
8. Review `docs/architecture.md`, `docs/data-model.md`, and `docs/api-design.md`.
9. Run the POC defined in `docs/hosting-and-deployment-strategy.md` before full implementation.

## Contents

- Product definition, scope, and requirements
- DForge reference analysis
- Hosting, deployment, domain, and module strategy:
  - `docs/hosting-and-deployment-strategy.md`
  - `docs/domain-management.md`
  - `docs/application-builder-and-modules.md`
- Deriv API integration reference: `docs/deriv-api-reference.md`
- Gap register and decision tracker: `docs/gaps-and-open-items.md`
- Brand assets: `brand/bold-t-logo.svg`, `brand/bold-t-favicon.svg`
- User journeys, roles, and feature matrix
- Brand and UI guidelines
- Architecture, data model, API design, and ADRs
- Security, privacy, threat model, and risk register
- Billing and integrations
- Testing and acceptance criteria
- Release, operations, monitoring, and incident runbooks
- Roadmap, progress, and decision register
- Initial website copy and glossary

## How to use these documents

These are living project artifacts. Update them as evidence and decisions become available. Record material changes in `docs/decision-log.md`, and keep `docs/progress.md` aligned with the real state of the repository.

Do not mark a feature complete without acceptance evidence.
