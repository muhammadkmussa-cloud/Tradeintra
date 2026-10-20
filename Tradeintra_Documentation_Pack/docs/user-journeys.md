# User Journeys

Journeys reflect the confirmed product direction: Deriv-only, Namecheap Stellar Plus-hosted, template + brand kit + modules, Namecheap Registrar, free subdomain, mock Deriv first.

## Journey 1: Create an account

1. Visitor opens `tradeintra.com`.
2. Chooses “Start free”.
3. Registers with name, email, password, optional referral code, or Google.
4. Verifies email.
5. Sets country (drives payment methods).
6. Completes onboarding: “Launch a Deriv site” / “Generate a bot” / “Set up signals”.
7. Lands on the dashboard with a clear next action.

**Success:** verified account, country set, no paid dependency.
**Failure states:** weak password, duplicate email, expired verification, Google error, unsupported country.

## Journey 2: Link Deriv (mock mode first)

1. User opens “Connect Deriv”.
2. Sees the permanent-binding warning.
3. Chooses “Connect with Deriv” (mock in development) or “Link with API token”.
4. Mock flow returns fixture account IDs and a clear **Simulated** badge.
5. User confirms the account.
6. Dashboard shows the linked account and mock status.

**Success:** mock link is usable for site demos and clearly labelled.
**Failure states:** cancelled consent, expired state, invalid token, duplicate binding.
**Live mode:** gated until Deriv access, scopes, OAuth redirect URIs, and legal review are approved.

## Journey 3: Launch a site from a template

1. Dashboard → “Create site”.
2. Chooses the **Deriv trading site** template.
3. Reviews template pages/modules.
4. Enters site name and optionally a subdomain slug.
5. Opens the brand kit:
   - logo/favicon;
   - brand name and copy;
   - colours and typography;
   - contact/social links;
   - risk disclaimer.
6. Enables/configures modules:
   - markets;
   - bot library;
   - signals;
   - announcements;
   - analytics.
7. Previews the site.
8. Resolves validation issues.
9. Chooses a free subdomain or custom domain.
10. Reviews plan limits and publishes.

**Success:** a persistent site exists; the published version is live on `slug.tradeintra.com` over HTTPS.
**Failure states:** invalid slug, taken slug, missing required disclosure, incompatible module, plan limit reached, publish failure.

## Journey 4: Choose a free subdomain

1. User enters `myshop`.
2. System validates format, reserved names, and uniqueness.
3. System shows `https://myshop.tradeintra.com`.
4. User confirms.
5. Site publishes with automatic SSL.

**Success:** subdomain routes to the correct tenant.
**Failure states:** reserved, taken, abusive, too short/long.

## Journey 5: Buy a custom domain

1. User opens Domains → Buy domain.
2. Searches `mybusiness.com`.
3. System shows:
   - available/taken/unsupported;
   - registration price;
   - renewal price;
   - premium warning if applicable.
4. User selects a term and continues.
5. System re-checks price and availability.
6. User enters registrant contact details.
7. User pays via Paystack/M-Pesa.
8. System creates a domain order and calls the Namecheap domain service (or the manual fallback).
9. Order status is shown: registering → active → DNS pending → SSL pending → live.
10. Domain is assigned to the site.

**Success:** domain is active, verified, and served over HTTPS.
**Failure states:** taken after quote, price changed, unsupported TLD, contact validation failure, payment failure, registrar failure, SSL failure.

## Journey 6: Connect an existing domain

1. User enters a domain they already own.
2. System shows required DNS records or nameservers.
3. User updates DNS at their registrar.
4. System verifies ownership/configuration.
5. SSL is issued.
6. Domain is attached to the site.

**Success:** existing domain serves the site.
**Failure states:** wrong records, conflicting DNS, domain already attached elsewhere, verification timeout.

## Journey 7: Publish and update

1. User edits brand kit or modules.
2. Previews the draft.
3. Publishes.
4. System creates an immutable version.
5. Publish, hostname, DNS, and SSL status are visible.
6. User can roll back to a prior version.

**Success:** published version and history are understandable.
**Failure states:** validation error, entitlement exceeded, publish failure, domain/SSL not ready.

## Journey 8: Generate an XML bot (deferred until job limits are proven)

1. Opens AI Bot Generator.
2. Chooses a quick template or describes a strategy.
3. Optionally pastes a video link.
4. Configures market, symbol, trade type, stake, martingale, recovery, TP/SL.
5. Spends credits to generate.
6. Reviews verification/auto-fix results.
7. Runs a sandbox test.
8. Saves the bot.
9. Adds it to a site or downloads it.
10. Sees whether it is standard DBot-compatible or Tradeintra-only.

**Success:** a validated bot is stored and usable.
**Failure states:** insufficient credits, unclear prompt, invalid strategy, unsupported contract type, verification failure.

## Journey 9: Set up AI Signals (deferred)

1. Opens AI Signals.
2. Creates an order: strategy name/description, interval.
3. Connects Telegram bot/channel/group.
4. Chooses message template.
5. Starts the free trial.
6. Reviews delivery logs.
7. Subscribes after the trial if desired.

**Success:** signals are delivered on schedule and labelled AI-generated.
**Failure states:** Telegram permission error, invalid channel, trial expired, payment failure, delivery failure.

## Journey 10: Track earnings

1. Opens Commissions/Earnings.
2. Sees separate categories:
   - partner commission;
   - app markup;
   - domain sales;
   - AI credits;
   - marketplace/signals when enabled.
3. Filters by date/site.
4. Reviews payout status.
5. Sets a payout method where supported.

**Success:** amounts reconcile to provider records.
**Failure states:** unsettled period, missing payout method, provider discrepancy.

## Journey 11: Permission boundary

1. User A changes a site/domain/publish ID to User B’s.
2. Backend denies access without leaking data.
3. The attempt is logged.

**Success:** automated cross-tenant tests pass.

## Required UX states

For every journey: loading, empty, validation, success, failure, retry, permission-denied, offline, saving, and partial-failure states.
