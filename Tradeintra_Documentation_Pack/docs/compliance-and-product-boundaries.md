# Compliance and Product Boundaries

This is a product-risk checklist, not legal advice.

## 1. Core boundary

Tradeintra is a **software and site-building platform for Deriv operators**. It is not:

- a broker, exchange, or trading platform;
- a custodian of funds or assets;
- an investment adviser;
- a payment agent;
- affiliated with or endorsed by Deriv.

Trading happens on Deriv, in the end user’s own Deriv account, under Deriv’s terms.

## 2. Deriv relationship

- Tradeintra must not claim Deriv affiliation, endorsement, or regulatory status.
- Deriv can change, limit, or withdraw its API/programme at any time.
- Partner/affiliate status and OAuth app approval are dependencies, not rights.
- Tradeintra must follow Deriv’s terms, API limits, and marketing rules.
- Do not use Deriv trademarks in a misleading way.
- Reference facts about DForge/Deriv must not be presented as Tradeintra approvals.

## 3. Trading and financial functionality

Before enabling live functionality, determine:

- whether the product displays live market data;
- whether it simulates or executes trades;
- whether it connects to brokerage/exchange accounts;
- whether it routes, places, modifies, or cancels orders;
- whether it holds money or assets;
- which countries and customer types are served;
- whether providers permit the intended use;
- what licenses, disclosures, KYC/AML, recordkeeping, or other controls apply.

The launch plan uses **mock Deriv mode only**. Live trading is gated.

## 4. Revenue and disclosure

There are two separate monetisation layers:

1. **Deriv partner commission** — earned on referred client activity under Deriv’s partner programme.
2. **App markup** — up to 3% of potential payout, reducing the client’s payout.

Do not conflate them. Do not describe markup as free revenue. Disclose markup and its effect before a user trades. Do not promise a commission rate until it is approved in the partner account.

## 5. Domain resale

- Namecheap is the registrar provider.
- Tradeintra charges registrar cost + a configurable markup.
- Confirm that Namecheap’s terms permit the resale/markup model before launch.
- Registrations are generally non-refundable after success.
- Publish clear terms for ownership, renewal, expiry, transfer-out, disputes, and abuse.
- Collect and protect registrant contact data.
- Block domains that impersonate Deriv, Tradeintra, or a regulated entity.
- Domain registration does not create trademark rights.

## 6. Payment-agent boundary

DForge’s 22% payment-agent/M-Pesa share is **not approved** for Tradeintra. Do not implement payment-agent functionality until:

- legal/regulatory requirements are reviewed;
- payment-provider agreements are confirmed;
- custody/settlement responsibilities are defined;
- the commercial model is approved.

Ordinary subscription, domain, and credit payments are in scope.

## 7. Product and marketing controls

- Do not promise profits or investment performance.
- Do not claim regulation, certification, or compliance without evidence.
- Do not present simulated data as live.
- Label demo/mock environments.
- Label AI-generated bots/signals.
- Identify third-party dependencies and limitations.
- Do not use fake testimonials, user counts, uptime, or earnings.
- Do not claim “DBot-compatible” without an import test.
- Include risk disclosures on customer sites.

## 8. Regions and law

- Target markets must be defined before launch.
- Domain, payment, privacy, and consumer-protection obligations vary by country.
- Tradeintra’s legal entity and governing law must be confirmed.
- Obtain qualified legal/compliance review before live financial functionality or domain resale at scale.

## 9. Approval gate

Any feature involving real-money transactions, trade execution, custody, brokerage, investment recommendations, payment-agent activity, or regulated financial services requires explicit owner approval and professional review before implementation or launch.
