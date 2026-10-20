# DForge Reference Analysis

**Reference:** `https://dforge.site`  
**Research date:** 2026-10-19 / 2026-10-20  
**Status:** Authenticated dashboard inspected. Public pages, terms, developer files, and Deriv documentation inspected. Evidence was recorded in notes only; no screenshots are stored in this repository, per owner instruction.

## 1. Evidence labels

- **Observed:** directly seen during authorized interaction.
- **Owner-confirmed:** explicitly confirmed by the project owner.
- **Inferred:** reasoned interpretation that still needs verification.
- **Unknown:** not established.

## 2. Research log

| Date | Page/workflow | Context | Observation |
|---|---|---|---|
| 2026-10-19 | `https://dforge.site` | Public | Title: “DForge – No-Code Deriv Trading Site Builder, XML Bots & Telegram Signals.” Describes a Deriv-only no-code studio. |
| 2026-10-19 | Public marketing site | Public | Three assets: white-label Deriv sites, DBot XML bots, Telegram signals. Claims DBot/SmartTrader/AirRun templates, custom domains, auto DNS/SSL, tiered Deriv OAuth app pool, M-Pesa/Paystack. |
| 2026-10-19 | `home.dforge.site/en` | Public | Marketing detail: free start, custom domain required for a branded site, M-Pesa/Paystack, illustrative earnings labelled as illustrative. |
| 2026-10-19 | `home.dforge.site/en/pricing` | Public | Free tier; 20% monthly revenue share; domains from $4.43/year; AI credits; AI Builder top-ups; signals $8.99/30 days after 60-minute trial; AI site setup $1.49. |
| 2026-10-19 | `/terms` | Public | Kenya/JamessonsTech; 18+; no refunds; 20% revenue share; 15% marketplace fee after provider fees; 20% AI credit referral; domain rules; prohibited uses; risk disclaimers. |
| 2026-10-19 | `/privacy` | Public | Account data, linked Deriv identifiers, site config, analytics, payment data; Meta Pixel; 30-day deletion, 7-year payment records, 12-month logs; published sites processed on behalf of operators. |
| 2026-10-19 | `/developers`, `/llms.txt`, `/llms-full.txt`, `openapi.json`, well-known files | Public | Operations MCP at `mcp.dforge.site/mcp`, Streamable HTTP, bearer token, scopes `support`, `operations`, `finance_request`, `marketing`, `admin`; no payout execution. |
| 2026-10-19 | `https://mcp.dforge.site/healthz` | Public | `{"ok":true,"service":"dforge-operations-mcp","financialBoundary":"no_payout_execution"}`. |
| 2026-10-19 | Authenticated `/sites` | Account with no sites | Sidebar: Sites, Tutorials, Domains, Platform Updates (13), Deployments, Commissions, Earnings, Announcements, Website Editor, XML Bots, AI Bot Generator, AI Builder, AI Signals, Bot Store, Support, Settings. |
| 2026-10-19 | `/sites` empty state | Authenticated | “Connect your Deriv account” and “Create your first site”; one Deriv account per DForge account; link is permanent; OAuth recommended or API token. Site quota 0/5 in Settings. |
| 2026-10-19 | `/sites/new` | Authenticated | Creation blocked until Deriv link. Confirms a Deriv authentication gate. |
| 2026-10-19 | `/domains` | Authenticated | Buy Domain; tabs Domains, Config, Declaration, Docs; empty state. Buy dialog exposes a “Check” action. |
| 2026-10-19 | `/deployments` | Authenticated | “No deployments yet”; deployment history is per account. |
| 2026-10-19 | `/commissions` | Authenticated | Gross app markup dashboard; 80% user / 20% DForge share; V2; contract mix; traders; payout method prompt. |
| 2026-10-19 | `/earnings` | Authenticated | Streams: Payment Agent 22%, Marketplace sales, AI Credits Referral 20%, Site Referrals 5%. |
| 2026-10-19 | `/announcements` | Authenticated | Create announcements targeted to domains or all sites. |
| 2026-10-19 | `/website-editor` | Authenticated | Empty state: total sites, deployed, drafts; visual editor. |
| 2026-10-19 | `/bots` | Authenticated | Tabs: Scraped, My Bots, Arrange, Bot Store, Bot Ideas, Settings. |
| 2026-10-19 | `/ai-generator` | Authenticated | Plain-English strategy → DBot XML; TikTok/YouTube link; Settings/Attach/Verify/Generate; 13 credits per generate+verify; 0 credits; custom blocks only work on DForge sites, not official Deriv; quick templates. |
| 2026-10-19 | AI Generator settings | Authenticated | Market, symbol, trade type, prediction, stake, martingale, recovery mode, take profit, stop loss. Credit costs: generate 10, refine 3/message, verify+auto-fix 3. Packs: 30/$4.99, 65/$9.99, 150/$19.99. |
| 2026-10-19 | `/ai-builder` | Authenticated | “DerivBuilder”; Home, Your apps, Templates, Community; $2.00 balance; prompt + attachments; templates include Digit Analyser, Trading Terminal, Strategy Bot, Candle Charts, Signal Scanner, Session P&L, Turbos & Vanillas, Range Trader, Martingale Bot, Portfolio & Statement. |
| 2026-10-19 | AI Builder community | Authenticated | Remixable community apps (57–62 files). |
| 2026-10-19 | `/signals` | Authenticated | Signal orders; AI builds; Telegram delivery; 5-minute fulfillment claim; 90–240 seconds typical; free 60-minute trial; $8.99/30 days. Order wizard: strategy name/description, interval, Telegram setup, message template, review. |
| 2026-10-19 | `/bot-store-admin` | Authenticated | “Coming Soon” for a marketplace to sell XML bots, EA bots, courses, signal subscriptions. |
| 2026-10-19 | `/support` | Authenticated | Telegram, WhatsApp coming soon, channel, FAQ. Public contact page mentions signed-in support tickets; dashboard did not show a ticket UI. |
| 2026-10-19 | `/settings` | Authenticated | Email cannot be changed; display name; country; 2FA TOTP; verified email; Deriv API token scopes `read`, `trading_information`; permanent binding; usage 0 sites/0 deployments, quota 0/5, role User; delete account. |
| 2026-10-19 | `/tutorials` | Authenticated | 3 series/21 videos: beginner bootcamp, adding XML bots, AI Signals/Telegram. Episodes reference site creation, editor, commissions, bot store, AI Builder. |
| 2026-10-19 | Response headers | Public | `server: Vercel`, `x-powered-by: Next.js`, HSTS; marketing site Vercel. |
| 2026-10-19 | `openapi.json` / well-known | Public | MCP scopes/tools preview; no payout tool; `financialBoundary: no_payout_execution`. |
| 2026-10-19 | Deriv docs | Public | REST/WS API, OAuth/PKCE, scopes, OTP, limits, markup, partner analytics, wallet/payment agents. |
| 2026-10-19 | Deriv GitHub | Public | `trading-bot-template` (React 18, MobX, RxJS, Blockly, RSBuild, OAuth PKCE, DerivWS); `smarttrader`; `deriv-api-schemas`. |

## 3. Product summary

DForge is a no-code studio for Deriv operators. It produces three assets:

1. **White-label Deriv sites** with DBot, SmartTrader, and AirRun templates, visual branding, custom domains, DNS/SSL, and deployment history.
2. **DBot XML bots** generated from plain English/video, uploaded, extracted, tested, stored, and distributed.
3. **Telegram signals** generated by an AI signal engine, scheduled, and sold in tiers.

It also exposes AI Builder for generated trading apps, a marketplace/bot store, announcements, commissions, earnings, referrals, and an operations MCP.

**DForge never executes trades.** Trading happens on Deriv, in the user’s own account, through Deriv OAuth/API.

## 4. Main customer types

- Deriv affiliates/site operators.
- Deriv bot creators.
- Deriv signal providers.
- Small teams building a branded trading presence.

## 5. Core workflows

1. Register → verify → link Deriv (permanent).
2. Create site → choose template → brand/editor → domain → deploy.
3. Generate/upload/extract XML bot → verify/test → assign/publish/sell.
4. Create signal order → connect Telegram → run trial/paid subscription.
5. Track commissions/earnings → set payout method → withdraw.
6. Admin/support via MCP with scoped tokens.

## 6. Product behavior matrix

| Question | Finding | Confidence |
|---|---|---|
| What can be created? | White-label Deriv sites, XML bots, Telegram signals, AI-generated apps | Observed |
| Is creation template-based or code-based? | Template-based with visual editing; AI generation for bots/apps | Observed |
| What is deployed? | A site/app served on a domain; DForge uses Vercel projects/domains | Observed + Inferred |
| Where is it hosted? | Vercel (headers, MCP tools) | Observed |
| Custom domain? | Yes; buy/connect; DNS/SSL automatic | Observed |
| Domain availability check? | Buy Domain dialog exposes “Check” | Observed |
| SSL automatic? | Claimed; Vercel automatic SSL | Observed + Inferred |
| Are generated sites isolated? | Tenant/site separation claimed; internal implementation not verified | Inferred/Unknown |
| Real broker/exchange integrations? | Deriv only | Observed |
| Trade execution by DForge? | No | Observed |
| Plan limits? | Site quota 0/5 for User; free/paid features; credits | Observed |
| Export/delete? | Account deletion; site export not verified | Partial |
| Logs/recovery? | Deployments page; logs/recovery not inspected | Partial |
| Payment agent? | 22% M-Pesa/payment-agent share displayed | Observed |
| Marketplace? | Marketing/terms describe it; dashboard says Coming Soon | Contradictory |

## 7. Commercial observations

- 20% DForge share of site app markup; 80% operator (commissions screen).
- Terms also describe 20% of monthly Deriv commission; treat as related but not identical.
- Domain sales from $4.43/year.
- AI bot credits: 30/$4.99, 65/$9.99, 150/$19.99; generate 10, refine 3, verify 3, run 13.
- AI Builder balance observed $2.00; marketing advertises $3.75.
- Signals: 60-minute trial; $8.99/30 days.
- Marketplace: 15% after provider fees (terms).
- AI credit referral: 20%; site referral: 5%; payment agent: 22%.
- Payments: M-Pesa, Paystack, Bachs, USDT; no refunds.

## 8. Technical observations

- Frontend: Next.js (headers, assets).
- DForge hosting: Vercel (reference observation, not Tradeintra).
- MCP: separate Express service behind nginx; stateless Streamable HTTP; bearer token.
- Database/auth/payment internals: not exposed; do not assume.
- Generated bots may use custom blocks that are not compatible with official Deriv.
- Deriv integration: OAuth/PKCE and WebSocket OTP; REST/WS; rate limits; markup/partner APIs.
- Reference bot/SmartTrader code is public in Deriv GitHub repositories.

## 9. Contradictions and unknowns

### Contradictions

- Bot Store dashboard says “Coming Soon” while marketing/terms describe a marketplace.
- Public contact page mentions support tickets; dashboard Support shows Telegram/WhatsApp/FAQ, no ticket UI observed.
- AI Builder balance and free bot credits differ between marketing and the authenticated account.
- Terms refer to “20% of monthly Deriv commission”; commissions screen reports gross app markup split 80/20.

### Unknowns

- Exact site editor controls and template differences (blocked by no Deriv link).
- Deployment logs/rollback behavior.
- Domain purchase provider/registrar backend and renewal flow.
- Marketplace live behavior.
- Support ticket backend.
- Internal DB, auth provider, AI provider, payment orchestration.
- Whether DForge’s partner commission is separate from app markup in reporting.

## 10. Implications for Tradeintra

- Deriv-only scope is confirmed; multi-broker is out.
- Vercel is the reference host, but Tradeintra is constrained to Namecheap Stellar Plus; do not assume parity.
- Domain purchase/availability is a core requirement, not an add-on.
- Template + brand kit + modules is a safer launch model than a free-form builder.
- Mock Deriv mode is necessary because Tradeintra has no Deriv account yet.
- Payment-agent functionality is high-risk and deferred.
- DBot compatibility must be tested, not assumed.
- Tenant isolation and domain ownership require explicit design.

## 11. Owner decisions required

- Confirm Namecheap registrar markup/resale terms with legal.
- Confirm registrant ownership/transfer-out policy.
- Confirm plan pricing and limits.
- Confirm first template scope and module list.
- Confirm Deriv account/partner/OAuth timeline.
- Confirm marketplace/signals phases.
- Confirm domain TLD list and markup rules.
