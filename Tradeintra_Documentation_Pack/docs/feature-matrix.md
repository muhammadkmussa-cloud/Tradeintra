# Feature Matrix

**Status labels:** `Reference-observed`, `Reference-inferred`, `Proposed`, `Confirmed`, `Deferred`, `Mock`, `Unverified`.

| ID | Feature | DForge observation | Tradeintra scope | Priority | Status |
|---|---|---|---|---|---|
| F-001 | Email/password registration | Observed: name, email, password policy, confirm password, optional referral code | Same, with email verification | P0 | Confirmed |
| F-002 | Google sign-in | Observed | Same | P1 | Proposed |
| F-003 | Email verification | Observed in settings | Required for sensitive actions | P0 | Confirmed |
| F-004 | TOTP 2FA | Observed in settings | Same, with recovery codes | P1 | Confirmed |
| F-005 | Deriv account linking | Observed: OAuth or API token, permanent binding, scopes `read` + `trading_information` | Mock first; live after approval | P0 | Mock |
| F-006 | Template gallery | Observed: DBot, SmartTrader, AirRun | One polished Deriv trading template first | P0 | Confirmed |
| F-007 | Ready-made site + brand kit | Observed visual editor, themes, loaders, nav styles, colours, layouts | Template + brand kit + module toggles; no free-form builder | P0 | Confirmed |
| F-008 | Module configuration | Reference-inferred from site editor and templates | Versioned module registry with compatibility rules | P0 | Confirmed |
| F-009 | Preview | Observed in editor/deployment workflow | Draft preview with validation | P0 | Confirmed |
| F-010 | Publish/deploy | Observed: deployments page, Vercel assignment, restore original design | Immutable config version + shared-runtime publish + rollback | P0 | Confirmed |
| F-011 | Publish history/status | Observed: Deployments page | Per-site publish, hostname, DNS, SSL history | P0 | Confirmed |
| F-012 | Free Tradeintra subdomain | Reference-inferred from site domains | `slug.tradeintra.com`, free plan, fair use | P0 | Confirmed |
| F-013 | Custom domain connection | Observed: Domains, config, declaration, docs | Connect and verify external domain | P0 | Confirmed |
| F-014 | Domain availability check | Observed: Buy Domain dialog exposes “Check” | Available/taken/unsupported + price | P0 | Confirmed |
| F-015 | Buy domain in platform | Observed: Buy Domain flow | Namecheap Registrar purchase (manual fallback) | P0 | Confirmed |
| F-016 | Domain renewals | Reference-inferred | Auto-renew, reminders, retries | P0 | Confirmed |
| F-017 | Per-TLD domain markup | Reference-inferred | Super Admin configurable | P0 | Confirmed |
| F-018 | DNS/SSL status | Observed: automatic DNS/SSL claim | Verified status before “live” | P0 | Confirmed |
| F-019 | XML bot upload | Observed: Upload Bot | Upload, validate, scan, store | P1 | Proposed |
| F-020 | Bot extraction/scraping | Observed: Extract bots / Scraped tabs | Deferred; legal/ToS review required | P3 | Deferred |
| F-021 | AI Bot Generator | Observed: plain English, video link, quick templates, credits, verify | Bounded jobs only after hosting POC | P3 | Proposed |
| F-022 | DBot XML compatibility | Observed claim: custom blocks work only on DForge sites | Label standard vs Tradeintra-only; test import | P0 | Confirmed |
| F-023 | Bot store/marketplace | Observed: “Coming Soon” dashboard; marketing describes marketplace | Deferred to phase 3 | P2 | Deferred |
| F-024 | AI Signals | Observed: orders, strategy, interval, Telegram, trial, $8.99/30d | Deferred until cron/job capacity is proven | P3 | Proposed |
| F-025 | Telegram delivery | Observed | Phase 2 | P2 | Proposed |
| F-026 | AI Builder | Observed: prompt, templates, community remix, credits, publish | Deferred until a safe runtime exists | P3 | Deferred |
| F-027 | Announcements | Observed: create/manage site announcements | Phase 1 | P2 | Proposed |
| F-028 | Commissions dashboard | Observed: gross app markup, 80/20 split, contract mix, traders | Separate partner commission vs markup | P1 | Proposed |
| F-029 | Earnings hub | Observed: Payment Agent 22%, Marketplace, AI credits 20%, site referrals 5% | Keep only approved streams; payment agent deferred | P1 | Confirmed |
| F-030 | Plans/entitlements | Observed: free start, paid features, site quota 5 for User | Free/paid plans, server-enforced | P0 | Confirmed |
| F-031 | Site quota | Observed: 0/5 for User role | Configurable by plan | P0 | Confirmed |
| F-032 | AI credits | Observed: 30/$4.99, 65/$9.99, 150/$19.99; run costs 13 | Credits ledger and packs | P1 | Proposed |
| F-033 | Domain purchase pricing | Observed: from $4.43/year | Registrar cost + markup | P0 | Confirmed |
| F-034 | Signal pricing | Observed: 60-min trial, $8.99/30 days | Phase 2 | P2 | Proposed |
| F-035 | Marketplace fee | Observed in terms: 15% after provider fees | Configurable; phase 3 | P2 | Deferred |
| F-036 | Support | Observed: Telegram, FAQ; public contact mentions tickets | Telegram/email first, ticket flow later | P1 | Confirmed |
| F-037 | Operations MCP | Observed: scoped bearer tokens, many tools, no payouts | Phase 3 admin surface | P3 | Proposed |
| F-038 | Audit log | Reference-inferred | Required for sensitive actions | P1 | Confirmed |
| F-039 | Account deletion | Observed: Danger Zone | Grace period + policy | P1 | Confirmed |
| F-040 | Country-based payment methods | Observed: country setting unlocks local methods | Required | P1 | Confirmed |
| F-041 | Multi-user collaboration | Not observed | Deferred | P3 | Unverified |
| F-042 | Export/delete site data | Reference-inferred | Define export and deletion | P2 | Proposed |
| F-043 | Real trading execution by platform | Observed: explicitly not done | Never | — | Confirmed |
| F-044 | Payment agent 22% share | Observed in Earnings | Deferred pending legal/provider review | — | Deferred |
| F-045 | Multi-broker support | Not observed; Deriv-only | Not in scope | — | Confirmed |

## Priority definitions

- **P0:** Required for the first usable release.
- **P1:** Important for a complete MVP.
- **P2:** Phase 2/3 enhancement.
- **P3:** Deferred or exploratory.

## Rules

- Do not mark a feature `Confirmed` in production without acceptance evidence.
- Do not claim DForge parity for features that were not observed.
- Do not implement deferred/regulated features without a new decision.
