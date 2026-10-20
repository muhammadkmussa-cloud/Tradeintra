# Deriv Integration Reference

**Status:** Research complete from public Deriv documentation. Live integration is gated (see `D-010` and `ADR 0005`). Tradeintra must run in **mock mode** until a Deriv account, partner/affiliate access (if required), and OAuth app credentials are verified.

**Source basis:** Deriv API documentation (`https://developers.deriv.com/docs/`), Deriv partner pages, and Deriv's public GitHub repositories. This is an integration reference, not a claim that Tradeintra has been approved by Deriv.

## 1. Product boundary

Tradeintra is a **software and site-building platform**. It does not:

- execute trades;
- hold customer trading funds;
- act as a broker or exchange;
- provide investment advice;
- guarantee trading outcomes.

Trading happens on Deriv, on the end user's own Deriv account, through Deriv's OAuth and API.

## 2. Environments and base URLs

| Purpose | URL |
|---|---|
| REST API | `https://api.derivws.com` |
| Public WebSocket | `wss://api.derivws.com/trading/v1/options/ws/public` |
| Demo WebSocket | `wss://api.derivws.com/trading/v1/options/ws/demo?otp=...` |
| Real WebSocket | `wss://api.derivws.com/trading/v1/options/ws/real?otp=...` |
| OAuth authorization | `https://auth.deriv.com/oauth2/auth` |
| OAuth token exchange | `https://auth.deriv.com/oauth2/token` |
| Staging OAuth | `https://staging-auth.deriv.com/oauth2/` |
| Staging API | `https://staging-api.derivws.com/trading/v1/` |

## 3. Authentication

### 3.1 OAuth 2.0 Authorization Code + PKCE

1. Generate a `code_verifier` (43–128 chars) and `code_challenge = BASE64URL(SHA256(verifier))`.
2. Generate a random `state` and store both values server-side, bound to the browser session.
3. Redirect the user to `https://auth.deriv.com/oauth2/auth` with:
   - `response_type=code`
   - `client_id`
   - `redirect_uri` (must match exactly)
   - `scope`
   - `state`
   - `code_challenge`
   - `code_challenge_method=S256`
   - optional `prompt=registration` for sign-up
   - optional partner attribution parameters on sign-up
4. Deriv redirects back with `code` and `state`. Verify `state`.
5. Exchange the code from the **backend** at `https://auth.deriv.com/oauth2/token` with `grant_type=authorization_code`, `client_id`, `code`, `code_verifier`, `redirect_uri`.
6. Receive a short-lived access token (typically 3600 seconds).

**Scopes:**

| Scope | Use |
|---|---|
| `trade` | Trading operations and account/OTP access |
| `account_manage` | Account creation and management |
| `application_read` | Read registered applications, partner analytics, markup statistics |
| `payment` | Payment-agent deposit/withdrawal operations |

Request the smallest scope that covers the job.

### 3.2 Personal Access Token (PAT)

PAT authentication is available for non-web clients. REST requests require both `Authorization: Bearer <token>` and `Deriv-App-ID: <app_id>`.

### 3.3 OTP WebSocket authentication

`POST /trading/v1/options/accounts/{accountId}/otp` returns a ready-to-use WebSocket URL containing a one-time password. The OTP:

- is valid for about 120 seconds;
- can be used only once;
- determines demo or real endpoint from the account ID.

Open the WebSocket immediately after requesting the OTP. Do not log the OTP or WebSocket URL.

## 4. REST API surface

### Options and accounts

| Method | Endpoint | Scope | Purpose |
|---|---|---|---|
| GET | `/trading/v1/options/accounts` | `trade` | List real and demo accounts |
| POST | `/trading/v1/options/accounts` | `account_manage` | Create an options account |
| POST | `/trading/v1/options/accounts/{account_id}/reset-demo-balance` | `trade` | Reset a demo account |
| POST | `/trading/v1/options/accounts/{accountId}/otp` | `trade` | Issue WebSocket OTP |
| POST | `/trading/v1/options/contracts/bulk-purchase/real` | per-account PATs | Bulk buy for real accounts |
| POST | `/trading/v1/options/contracts/bulk-purchase/demo` | per-account PATs | Bulk buy for demo accounts |

### Reporting and partners

| Method | Endpoint | Scope | Purpose |
|---|---|---|---|
| GET | `/applications/v1/markup-statistics` | `application_read` | Per-app markup and trading aggregates |
| GET | `/partners/analytics/v1/overview` | `application_read` | Sign-up, master-partner and activity summaries |
| POST | `/partners/client-tags/check` | `application_read` | Check whether clients are tagged to the partner |

### Wallet

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/wallet/v1/wallets` | List wallets |
| GET | `/wallet/v1/transactions/{wallet_type}` | Paginated wallet transactions |
| GET | `/wallet/v1/exchange-rate` | Exchange rate |
| POST | `/wallet/v1/transfers/validate` | Validate a transfer and fees |
| POST | `/wallet/v1/transfers` | Transfer between wallets |
| POST | `/wallet/v1/transfers/exchange` | Cross-currency transfer |
| POST | `/wallet/v1/transfers/platforms` | Transfer to/from trading platform accounts |

### Payment agents

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/payment-agents/v1/agents` | List payment agents |
| GET | `/payment-agents/v1/agents/{id}` | Get an agent profile (`me` for own profile) |
| GET | `/payment-agents/v1/agent-statistics` | Covered countries/currencies |
| GET/PATCH | `/payment-agents/v1/clients/me` | Client payment-agent settings |
| POST | `/payment-agents/v1/transfer` | Agent deposit to a client |
| GET | `/payment-agents/v1/transfer/{request_id}` | Transfer status |
| POST | `/payment-agents/v1/withdraw/verification_code` | Request withdrawal verification code |
| POST | `/payment-agents/v1/withdraw` | Agent withdrawal |
| GET | `/payment-agents/v1/withdraw/{request_id}` | Withdrawal status |

**Tradeintra does not implement payment-agent functionality in the first release.** See `ADR 0007`. These endpoints are documented only as a future integration boundary.

### System

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/v1/health` | Service health |

## 5. WebSocket message surface

WebSocket requests are JSON messages with a unique `req_id`. Responses include `msg_type`, `req_id`, and optionally `error`.

### Market data

- `active_symbols`
- `contracts_for`
- `contracts_list`
- `ticks`
- `ticks_history`

### Account

- `balance`
- `portfolio`
- `profit_table`
- `statement`
- `transaction`
- `authorize`

### Trading

- `proposal`
- `buy`
- `sell`
- `proposal_open_contract`
- `contract_update`
- `contract_update_history`
- `cancel`
- bulk purchase (REST)
- automation: `auto_list_strategies`, `auto_start`, `auto_get`, `auto_list`, `auto_pause`, `auto_resume`, `auto_stop`

### Subscriptions

- `forget`
- `forget_all`

### System

- `ping`
- `time`
- `trading_times`
- health check

## 6. Rate limits

### WebSocket

| Calls sharing a budget | Per minute | Per hour |
|---|---:|---:|
| `proposal`, `proposal_open_contract`, `buy`, `sell` | 360 | 14,400 |
| `balance`, `statement` | 100 | 2,000 |
| `portfolio`, `profit_table` | 30 | 1,500 |
| All other calls | 220 | 14,400 |
| `ping` | 10 per second per connection | — |

### REST

| Counted against | Window | Limit |
|---|---:|---:|
| IP address | 1 minute | 300 requests |
| IP address | 10 minutes | 1,000 requests |
| Logged-in user | 1 minute | 80 requests |

Design for subscriptions rather than polling, reuse one WebSocket connection, and back off exponentially after a rejection.

## 7. Monetisation model

Deriv exposes two distinct layers. They must not be conflated.

### 7.1 Partner commission

Deriv's partner programme pays commission on referred client activity. Public partner materials describe:

- Options trading: 40% of Deriv revenue from referred clients' trading activity;
- Deriv Exchange: 30% of trading fees;
- CFDs: volume-based rates;
- sub-partner referral: 7.5% of referred partners' commissions;
- tier boosts at higher monthly commission levels.

Rates and programme terms can change. Tradeintra must not promise a rate until it is approved in the partner account.

### 7.2 App markup

A registered Deriv application can set a markup of up to **3%** of the potential payout. The markup reduces the client's potential payout. Markup is separate from partner commission.

**Reference observation:** DForge's commissions screen reports "gross app markup" and an 80% user / 20% DForge split. Its terms also refer to a 20% revenue share of the site's monthly Deriv commission. These are related but not identical concepts; do not treat one as proof of the other.

### 7.3 Tradeintra policy

- Do not enable markup until the Deriv app and partner setup are approved.
- Do not describe markup as a fee-free revenue stream; it affects user payouts.
- Display markup and its effect clearly before a user trades.
- Record the approved rate and disclosure in the decision log.
- Keep partner commission and app markup as separate ledger categories.

## 8. DBot XML and bot compatibility

DBot strategies are Google Blockly XML documents. They contain blocks for trade definition, purchase, and post-purchase logic, plus variables and risk controls.

Important compatibility facts:

- Deriv's bot platform uses Blockly; variable names became case-insensitive after Blockly v10.
- Deriv publishes a white-label bot template (`deriv-com/trading-bot-template`) built with React 18, MobX, RxJS, Blockly, RSBuild, OAuth PKCE, and DerivWS.
- Deriv publishes `deriv-com/smarttrader`, the static SmartTrader application.
- DForge states that bots generated by its AI generator use custom blocks and therefore work only on DForge-powered sites, not on the official Deriv site.

**Implication for Tradeintra:** if Tradeintra generates custom Blockly blocks, generated bots may not be portable to official Deriv. Either:

1. generate only standard DBot-compatible blocks, and test import on official Deriv; or
2. generate custom blocks and clearly label the bot as Tradeintra-only.

Do not claim "DBot-compatible" without an import test on the target platform.

## 9. Mock mode (required before live access)

Tradeintra must support a **mock Deriv provider** with the same interface as the live provider:

- mock OAuth authorize/callback and token exchange;
- fixture accounts (demo/real), balances, symbols, ticks, proposals, contracts;
- deterministic success and failure cases;
- simulated latency and rate-limit errors;
- no real orders, no real funds, no real tokens;
- a persistent "Simulated data" label in the UI and in exported reports;
- a feature flag that prevents mock mode from being enabled in production for end users.

Public market data may be used only where Deriv permits it and must be labelled with its source and freshness.

## 10. Live-mode readiness checklist

- [ ] Deriv account created and verified.
- [ ] Partner/affiliate application submitted and approved where required.
- [ ] OAuth application registered with exact redirect URIs.
- [ ] Client ID and secret stored in a secret manager.
- [ ] Scopes confirmed as least-privilege.
- [ ] Token exchange performed server-side.
- [ ] Token refresh/re-authentication behaviour tested.
- [ ] WebSocket OTP flow tested for demo and real accounts.
- [ ] Rate-limit and reconnect behaviour tested.
- [ ] Markup rate and user disclosure approved.
- [ ] Partner commission reporting verified.
- [ ] Legal/compliance review completed for target markets.
- [ ] Mock/live mode separation verified in production configuration.

## 11. Security notes

- Never expose the Deriv client secret, access token, refresh token, or OTP in browser code, logs, screenshots, or support tickets.
- Prefer a backend-for-frontend token exchange; do not perform the token exchange in the browser.
- Bind OAuth `state` and PKCE verifier to the user session and expire them quickly.
- Store tokens encrypted at rest with short retention.
- Do not use a single global Deriv token for all tenants.
- Treat the Deriv account link as a sensitive, auditable action.
- Revoke tokens on account deletion and on suspected compromise.

## 12. References

- Deriv API documentation: `https://developers.deriv.com/docs/`
- OAuth 2.0: `https://developers.deriv.com/docs/intro/oauth/`
- Authentication: `https://developers.deriv.com/docs/intro/authentication/`
- Limits: `https://developers.deriv.com/docs/limits/`
- Markup: `https://developers.deriv.com/docs/intro/markup/`
- Partner programme: `https://deriv.com/partners`
- Trading bot template: `https://github.com/deriv-com/trading-bot-template`
- SmartTrader: `https://github.com/deriv-com/smarttrader`
- API schemas: `https://github.com/deriv-com/deriv-api-schemas`
