# Environment and Setup

**Status:** Local studio and opt-in staging POC harness implemented. Actual Namecheap Stellar Plus / cPanel deployment is unverified. See `cpanel-poc-runbook.md` for current executable commands; tables below remain proposed production requirements.

## 1. Prerequisites

- Namecheap Stellar Plus hosting with cPanel
- Supported Node.js version selected in cPanel (prefer Node 20/22/24 after testing)
- PostgreSQL database created in cPanel
- SSH access enabled for the hosting account (for migrations/diagnostics)
- Namecheap API credentials for sandbox/testing
- Paystack and M-Pesa sandbox credentials
- cPanel email account for SMTP
- Optional AI provider credentials

## 2. Proposed stack

| Layer        | Choice                                             |
| ------------ | -------------------------------------------------- |
| Framework    | Next.js + React + TypeScript                       |
| Styling      | Self-hosted CSS token system                       |
| Animation    | CSS transitions and reduced-motion media queries   |
| Client state | React state and focused hooks                      |
| Server state | Route-handler fetch + account-scoped service layer |
| Backend      | Next.js Route Handlers + Node server               |
| Hosting      | cPanel Node.js app on Stellar Plus                 |
| Database     | PostgreSQL on Stellar Plus                         |
| Data layer   | Kysely + `pg`                                      |
| Files        | Local `storage/{account_id}/...`                   |
| Jobs         | PostgreSQL `jobs` + cPanel cron                    |
| Auth         | Custom scrypt/DB sessions for the MVP              |
| Email        | cPanel/Namecheap SMTP                              |
| Domains      | Namecheap API                                      |
| Payments     | Paystack + M-Pesa                                  |
| Cache        | In-process/DB; no Redis                            |
| Tests        | Vitest/Jest + Playwright                           |
| Lint/format  | ESLint + Prettier or Biome                         |

## 3. cPanel application setup

1. Create the Node.js application in cPanel.
2. Select the supported Node.js version.
3. Set:
   - application root;
   - application URL;
   - startup file (for example `server.js`);
   - environment variables.
4. Upload the release.
5. Run `npm install` / build as appropriate.
6. Start/restart the application.
7. Verify the health endpoint.

Do not assume a local Next.js server behaves identically under cPanel/Passenger. Test on staging.

## 4. Environment variables

Names are indicative.

| Variable                                                                                  | Purpose                                                          |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `APP_URL`                                                                                 | Public base URL                                                  |
| `TENANT_HOST_SUFFIX`                                                                      | Free-subdomain suffix, e.g. `tradeintra.com`                     |
| `TENANT_CUSTOM_HOSTS`                                                                     | Set `true` to route unknown hosts through active `host_mappings` |
| `DATABASE_URL`                                                                            | PostgreSQL connection                                            |
| `AUTH_SECRET`                                                                             | Session signing                                                  |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                               | Google sign-in                                                   |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD`                                 | cPanel email                                                     |
| `NAMECHEAP_API_USER` / `NAMECHEAP_API_KEY` / `NAMECHEAP_USERNAME` / `NAMECHEAP_CLIENT_IP` | Domain API                                                       |
| `NAMECHEAP_ENV`                                                                           | `sandbox` or `production`                                        |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY`                                             | Payments                                                         |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET`                                            | M-Pesa                                                           |
| `MPESA_PASSKEY` / `MPESA_SHORTCODE`                                                       | M-Pesa                                                           |
| `AI_PROVIDER_API_KEY`                                                                     | Optional AI                                                      |
| `DERIV_MODE`                                                                              | `mock` or `live`                                                 |
| `DERIV_CLIENT_ID` / `DERIV_CLIENT_SECRET` / `DERIV_REDIRECT_URI`                          | Live only                                                        |
| `FEATURE_LIVE_DERIV`                                                                      | Server-side gate                                                 |
| `FEATURE_PAYMENT_AGENT`                                                                   | Must remain false                                                |
| `CRON_SECRET`                                                                             | Protect cron endpoint                                            |
| `STORAGE_ROOT`                                                                            | Local storage path outside web root                              |

Store secrets in cPanel environment variables or a protected file, never in Git.

## 5. PostgreSQL setup

1. Create a database and user in cPanel.
2. Confirm the server version (expected PostgreSQL 10.23).
3. Test `pg`/Kysely connectivity.
4. Run migrations via SSH/CLI.
5. Enable RLS and tenant policies.
6. Seed plans, templates, modules, and domain price rules.
7. Back up before migrations.

Avoid PostgreSQL features newer than version 10.

## 6. Local storage setup

- Create `storage/` outside `public_html`.
- Set permissions so only the app user can read/write.
- Create `storage/{account_id}/` per tenant.
- Enforce quotas and clean up orphans.
- Include `storage/` in backups.
- Never serve files directly from a public path.

## 7. Cron setup

- One protected cron job every 5 minutes (Namecheap minimum).
- Call the internal job endpoint or CLI runner with `CRON_SECRET`.
- Keep runtime short; no overlapping jobs.
- Add `>/dev/null 2>&1` to suppress cron emails unless logging is intended.
- Monitor job failures and stuck jobs.

## 8. Namecheap API setup

- Enable API access in the Namecheap account.
- Whitelist the hosting server’s outbound IPv4.
- Use sandbox for testing if available.
- Confirm production access and any balance requirements.
- Configure credentials in cPanel.
- Test search/check/register/renew/DNS in a controlled flow.

## 9. Email setup

- Create a cPanel email account.
- Configure SMTP credentials.
- Set SPF, DKIM, and DMARC in Namecheap DNS.
- Respect sending limits.
- Test verification, password reset, receipts, and domain notices.

## 10. Troubleshooting

- cPanel Node app will not start.
- Passenger startup file/app root wrong.
- Node version mismatch.
- PostgreSQL connection/version mismatch.
- Migration failure.
- RLS/tenant query failure.
- Cron does not run or times out.
- Wildcard subdomain does not route.
- SSL certificate does not cover a subdomain.
- Namecheap API IP not whitelisted.
- SMTP blocked/rate-limited.
- Disk/inode limit reached.

## 11. Setup acceptance

A developer should be able to deploy the app to staging on Stellar Plus, run migrations, start the Node app, reach the health endpoint, process one cron job, and publish a demo tenant on a subdomain over HTTPS.

## Implemented local MVP modes — 2026-10-20

`npm run dev` now offers server-backed local development accounts in addition to the separate browser demo. See root README and `mvp-delivery.md`. Default private data is `~/.local/share/tradeintra-studio`; PGlite is development-only and not a production database decision. A built runtime disables accounts unless explicit local/staging variables are supplied. `STUDIO_DB_MODE=postgres`, `STUDIO_ENV=staging`, `STUDIO_ENABLED=true`, `APP_URL`, and `DATABASE_URL` enable only the approved staging adapter, after explicit `npm run studio:migrate -- --apply`. Actual host/PG/SSL compatibility and production acceptance are still unverified.
