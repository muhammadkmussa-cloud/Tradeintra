# Decision Log

Record material decisions chronologically. Add a new entry rather than silently changing a past decision.

## D-001 — Product direction
- **Status:** Owner-confirmed
- **Decision:** Tradeintra lets customers create, customize, manage, and deploy trading platforms.
- **Date:** 2026-10-19
- **Notes:** Scope refined after DForge discovery.

## D-002 — Domain
- **Status:** Owner-confirmed
- **Decision:** `https://Tradeintra.com`
- **Date:** 2026-10-19

## D-003 — Brand colors
- **Status:** Owner-confirmed
- **Decision:** Yellow `#FEDD00`, deep purple `#0D000A`, neutral white `#F3F2F2`.
- **Date:** 2026-10-19

## D-004 — Wordmark/logo direction
- **Status:** Direction agreed; final artwork pending
- **Decision:** Lowercase `tradeintra` wordmark and custom lowercase `t` symbol with restrained yellow accent.
- **Date:** 2026-10-19

## D-005 — Tagline
- **Status:** Owner-confirmed
- **Decision:** `Build. Deploy. Trade.`
- **Date:** 2026-10-19

## D-006 — Reference scope
- **Status:** Owner-confirmed
- **Decision:** Mirror the full DForge feature map: sites, XML bots, AI Bot Generator, AI Builder, AI Signals/Telegram, marketplace, announcements, commissions, earnings, referrals, operations MCP.
- **Date:** 2026-10-20
- **Notes:** Delivery is phased; the first release focuses on account, site, brand kit, domain, publish, and mock Deriv.

## D-007 — Market/broker scope
- **Status:** Owner-confirmed
- **Decision:** Deriv-only. No multi-broker support at launch.
- **Date:** 2026-10-20

## D-008 — Hosting
- **Status:** Superseded by D-018
- **Decision:** Vercel Pro only for the launch (control plane, multi-tenant renderer, Domains API, DNS/SSL, Blob). No second CDN or edge provider in the launch plan.
- **Date:** 2026-10-20
- **ADR:** `ADR 0002` (superseded)

## D-009 — Registrar
- **Status:** Superseded by D-019
- **Decision:** Vercel Registrar only, behind a `DomainProvider` adapter.
- **Date:** 2026-10-20
- **ADR:** `ADR 0003` (superseded)

## D-010 — Deriv integration mode
- **Status:** Owner-confirmed
- **Decision:** Mock Deriv first. Live integration gated on account, partner/OAuth access, scopes, redirect URIs, and legal review.
- **Date:** 2026-10-20
- **ADR:** `ADR 0005`

## D-011 — Site creation model
- **Status:** Owner-confirmed
- **Decision:** Ready-made template + brand kit + module configuration. No free-form drag-and-drop builder in the first release.
- **Date:** 2026-10-20
- **ADR:** `ADR 0004`

## D-012 — First template
- **Status:** Owner-confirmed
- **Decision:** One polished Deriv trading site template first; DBot/SmartTrader/AirRun-style templates later.
- **Date:** 2026-10-20

## D-013 — Free subdomains
- **Status:** Owner-confirmed
- **Decision:** Free `slug.tradeintra.com` on the free plan, subject to fair use and compliance.
- **Date:** 2026-10-20
- **ADR:** `ADR 0006`

## D-014 — Domain pricing
- **Status:** Owner-confirmed
- **Decision:** Registrar cost + **15% default markup per TLD**, configurable by Super Admin. Show registration and renewal prices. Currency is USD with KES conversion at checkout.
- **Date:** 2026-10-20
- **Notes:** Namecheap resale/markup terms, tax treatment, and FX rounding require legal/finance review.

## D-015 — Payment-agent functionality
- **Status:** Owner-confirmed
- **Decision:** Defer the 22% M-Pesa/payment-agent share and any payment-agent activity until legal and provider review.
- **Date:** 2026-10-20
- **ADR:** `ADR 0007`

## D-016 — Architecture model
- **Status:** Superseded by D-020
- **Decision:** Central control plane + multi-tenant Next.js renderer for curated sites; separate Vercel projects for AI-generated apps; Postgres + RLS; Redis; Vercel Blob.
- **Date:** 2026-10-20
- **Notes:** Superseded by the Namecheap shared-runtime decision.

## D-017 — Domain ownership
- **Status:** Proposed, requiring legal review
- **Decision:** Tradeintra holds the Namecheap account; the customer is the registrant contact; customers can request transfer-out under policy.
- **Date:** 2026-10-20

## Pending decisions

- Plan names, prices, and limits.
- Domain TLD list and exact markup values.
- Whether Namecheap resale/markup is permitted.
- Registrant ownership/transfer-out terms.
- Deriv account/partner/OAuth timeline.
- Marketplace/signals launch timing.
- Namecheap API production access/IP whitelisting.
- Wildcard SSL and cPanel automation behavior.
- PostgreSQL 10.23/Kysely compatibility.
- Shared-hosting capacity and practical tenant limit.
- Support ticket implementation.
- Tax/VAT handling.
- Data retention periods.


## D-018 — Hosting (final)
- **Status:** Owner-confirmed
- **Decision:** Namecheap Stellar Plus shared hosting with cPanel is mandatory. No VPS, Vercel, Neon, Supabase, Redis, Docker, or external hosting/database provider as a required dependency.
- **Date:** 2026-10-20
- **ADR:** `ADR 0008`

## D-019 — Registrar (final)
- **Status:** Owner-confirmed, subject to API/terms verification
- **Decision:** Namecheap API behind a `DomainProvider` adapter, sandbox first, manual fallback. No Vercel Registrar.
- **Date:** 2026-10-20
- **ADR:** `ADR 0012`

## D-020 — Shared runtime and jobs
- **Status:** Owner-confirmed, pending POC
- **Decision:** One shared Next.js runtime on cPanel; publish = immutable tenant configuration. PostgreSQL-backed jobs processed by cPanel cron. No Redis or persistent worker. Local file storage. Kysely + pg, subject to PostgreSQL 10.23 compatibility.
- **Date:** 2026-10-20
- **ADRs:** `ADR 0009`, `ADR 0010`, `ADR 0011`, `ADR 0013`
