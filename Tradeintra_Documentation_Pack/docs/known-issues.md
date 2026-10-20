# Known Issues and Limitations

## Current limitations

- No application implementation exists yet.
- No Deriv account, partner approval, or OAuth app credentials.
- Stellar Plus shared-hosting limits are not yet measured.
- Wildcard subdomain routing and SSL behavior are unverified.
- cPanel automation for addon domains/subdomains is unverified.
- PostgreSQL 10.23/Kysely compatibility is unverified.
- Cron is limited to a 5-minute minimum and 5 simultaneous jobs.
- Next.js build/process memory may exceed shared-hosting limits.
- No Redis, persistent worker, VPS, Vercel, Neon, or external hosting fallback is permitted.
- Live Deriv integration is not available; mock mode only.
- Namecheap registrar markup/resale terms and registrant ownership need legal review.
- Exact Namecheap API access, TLD coverage, and pricing must be verified at implementation time.
- DForge site editor, deployment logs, marketplace, and bot store were not fully inspectable because the account had no site and establishing a Deriv link is permanent.
- Reference contradictions remain: Bot Store “Coming Soon” vs marketplace marketing; support ticket mention vs dashboard; AI balance/credit differences.
- Plan pricing and limits are not final.
- Domain markup values are not final.
- Payment-agent functionality is deferred.
- Marketplace/signals are phase 2/3.
- No tax/VAT policy yet.
- No production support SLA yet.

## Issue template

For each issue record:
- ID
- Summary
- Environment
- Reproduction steps
- Expected result
- Actual result
- Severity
- Workaround
- Owner
- Status
- Related test/decision
