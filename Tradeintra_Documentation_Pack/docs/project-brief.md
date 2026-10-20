# Project Brief

## 1. Overview

Tradeintra is a **Deriv-only, no-code operator studio**. It lets customers launch and manage:

1. a branded Deriv trading site;
2. DBot-compatible XML trading bots;
3. AI-generated trading signals delivered to Telegram.

Customers can start from a ready-made site template, apply their brand, enable modules, choose a free Tradeintra subdomain or a custom domain, and publish. Tradeintra also provides domain purchase, publish status, announcements, marketplace, commissions, and earnings tooling. Arbitrary AI-generated apps are deferred.

- Brand: `tradeintra`
- Domain: `https://Tradeintra.com`
- Reference product: `https://dforge.site/sites`
- Tagline: `Build. Deploy. Trade.`
- Launch market: Deriv operators (affiliates, bot creators, signal providers)
- Launch hosting: Namecheap Stellar Plus / cPanel
- Launch registrar: Namecheap API (manual fallback)
- Live trading: **not executed by Tradeintra**

## 2. Reference findings

DForge is a no-code studio for Deriv operators. Its public site and authenticated dashboard expose:

- white-label Deriv sites using DBot, SmartTrader, and AirRun templates;
- visual branding/editor controls, custom domains, DNS, SSL, and deployment history;
- DBot XML bot generation, upload, extraction, bot store, and bot ideas;
- AI Signals with Telegram delivery, free trial, and paid subscriptions;
- AI Builder for generated trading applications (deferred);
- commissions, earnings, referrals, announcements, and an operations MCP server.

DForge does not execute trades. Trading happens on Deriv, in the end user’s own Deriv account, through Deriv OAuth/API. DForge is independent of Deriv.

## 3. Problem statement

Deriv affiliates and operators want a branded site, bot distribution, and signal business without assembling hosting, domains, authentication, publishing, and payment infrastructure. Existing tools either require code or do not combine site publishing, bots, signals, and earnings in one operator workflow.

Tradeintra removes that integration work while keeping the trading boundary with Deriv.

## 4. Product vision

Provide the simplest path from “I want a branded Deriv trading business” to a live, branded site with bots, signals, domain, and earnings visibility — without writing code, managing servers, or handling Deriv credentials directly.

## 5. Target audiences

- **Deriv affiliates/site operators** who want a branded site and commission visibility.
- **Bot creators** who want to generate, test, distribute, and sell DBot XML bots.
- **Signal providers** who want scheduled signals delivered to Telegram audiences.
- **Small teams** that need a professional trading presence without a engineering team.

These are hypotheses derived from the reference; validate with real customers.

## 6. Product principles

- Deriv-only at launch. Do not imply multi-broker support.
- Template-first, not blank-canvas. Ready-made sites with brand and module configuration.
- Honest boundaries: Tradeintra builds and attributes; Deriv trades.
- Tenant isolation in data, files, jobs, and domains.
- Clear publish, domain, and renewal status.
- No fake metrics, testimonials, or performance claims.
- Keep providers replaceable behind adapters.
- Ship a secure MVP before adding regulated or high-risk features.

## 7. Scope

### In scope for launch

- account creation, verification, sign-in, 2FA, settings;
- Deriv account linking in **mock mode** until live access is approved;
- one polished Deriv trading site template;
- brand kit and module configuration;
- free `slug.tradeintra.com` subdomain;
- custom domain search, purchase, connection, DNS/SSL status, renewal;
- publish, preview, publish history, rollback;
- plans, entitlements, usage limits, billing;
- announcements, support, audit, admin/Super Admin.

### Out of scope / deferred

- Trade execution by Tradeintra.
- Custody of funds or assets.
- Brokerage or exchange services.
- Investment advice or return guarantees.
- Payment-agent functionality and the 22% M-Pesa share.
- Multi-broker support.
- Arbitrary customer code in curated template sites.
- AI-generated standalone applications.
- AI Bot Generator and AI Signals until hosting job limits are proven.
- Marketplace/bot store.
- Free-form drag-and-drop page builder.
- Unverified market-data or broker integrations.

## 8. Business model (proposed)

- Free plan: one published app, free subdomain, selected modules, basic customization, Tradeintra branding, fair-use limits.
- Paid plans: custom domains, more apps, premium modules, higher limits, branding removal.
- Domain sales: registrar cost + centrally configurable markup per TLD.
- AI Bot Generator credits.
- AI Builder top-ups.
- Marketplace commission (configurable, subject to review).
- Signal subscriptions (phase).
- Deriv partner commission and app markup only after approval.

## 9. Success measures

Define targets after the POC and first customer cohort:

- time to first published site;
- publish success rate;
- domain purchase success rate;
- trial-to-paid conversion;
- publish/domain failure recovery time;
- support request rate;
- retention and churn;
- gross margin per site after hosting, domains, and AI usage.

Do not publish invented metrics.

## 10. Current stage

Discovery is complete. Product direction, host, registrar, template model, subdomain policy, payment-agent deferral, and mock Deriv approach are owner-confirmed. Implementation has not started. The next gate is the POC defined in `hosting-and-deployment-strategy.md`.
