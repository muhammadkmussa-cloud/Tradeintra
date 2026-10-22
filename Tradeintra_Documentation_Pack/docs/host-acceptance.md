# Stellar Plus production acceptance

**Status:** Not executed. No host credentials or production provider keys were supplied. This checklist records the evidence required before calling the Namecheap deployment production-ready.

## 1. Release and runtime

- [ ] Upload the standalone release outside `public_html`.
- [ ] Select the approved Node version (22.15+).
- [ ] Set startup file to `cpanel-start.js`.
- [ ] Do not run cPanel “Run NPM Install”.
- [ ] Set environment variables securely.
- [ ] Confirm `/api/health` returns 200.
- [ ] Confirm `/api/health/ready` reports database, schema, RLS, and storage.
- [ ] Run `npm run host:check` and archive the redacted JSON report.
- [ ] Confirm `/api/health/providers` reports the intended modes without secrets.
- [ ] Restart the app and confirm the previous release can be restored.

## 2. PostgreSQL 10.23

- [ ] Create the dedicated database and least-privilege role.
- [ ] Confirm server version.
- [ ] Run `npm run studio:migrate -- --apply`.
- [ ] Confirm RLS is enabled and FORCE RLS is active on tenant/commerce tables.
- [ ] Confirm `sites_one_active` exists.
- [ ] Run cross-tenant read/write probes.
- [ ] Confirm JSONB, transactions, advisory locks, and `SKIP LOCKED`.
- [ ] Measure connection limits and pool behavior.
- [ ] Restore a backup into an isolated database.

## 3. Domain routing and TLS

- [ ] Attach `tradeintra.com` and `www`.
- [ ] Configure `*.tradeintra.com`.
- [ ] Confirm the Node app receives the original `Host`.
- [ ] Confirm unknown hosts fail closed.
- [ ] Confirm `/api/studio` is blocked on tenant hosts.
- [ ] Confirm AutoSSL or a wildcard certificate covers all tenant hosts.
- [ ] Attach one custom domain as an addon domain.
- [ ] Confirm HTTP redirects to HTTPS.
- [ ] Confirm certificate renewal behavior.

## 4. Files and storage

- [ ] Set `STORAGE_ROOT` outside both the app and web roots.
- [ ] Confirm `0700` directories and `0600` files.
- [ ] Confirm upload size limits.
- [ ] Confirm path traversal, symlink, and cross-account reads are denied.
- [ ] Confirm buyer-only delivery downloads.
- [ ] Confirm storage is included in backups.
- [ ] Measure disk and inode quotas.

## 5. Cron and jobs

- [ ] Configure the approved 5-minute cron.
- [ ] Schedule `npm run account:purge` for the 30-day deletion sweep (daily is sufficient).
- [ ] Schedule `npm run signals:deliver` at the approved interval.
- [ ] Schedule `npm run backup:db` daily and test restore into a separate database.
- [ ] Schedule `npm run monitor` and route failures to the incident channel.
- [ ] Confirm a protected tick processes bounded jobs.
- [ ] Confirm overlapping ticks do not duplicate work.
- [ ] Confirm retry, timeout, and stuck-job behavior.
- [ ] Confirm cron logs are private and redacted.
- [ ] Measure actual runtime and shared-host limits.

## 6. Providers

- [ ] Google OAuth redirect URI and authorized origins.
- [ ] DeepSeek sandbox/live request and spend cap.
- [ ] Paystack test transaction and webhook signature, including credit packs and signal subscriptions.
- [ ] M-Pesa sandbox STK and callback, including credit packs and signal subscriptions; set `MPESA_CALLBACK_SECRET` and `MPESA_ALLOWED_IPS` before live mode.
- [ ] Confirm a failed signal payment pauses the order.
- [ ] Confirm paid amount and currency match the order for Paystack and M-Pesa.
- [ ] Namecheap sandbox search/purchase/DNS/renewal, then production after approval.
- [ ] Confirm `_tradeintra.<domain>` TXT verification and trusted TLS activation for a real custom domain.
- [ ] SMTP verification/reset delivery and SPF/DKIM/DMARC.
- [ ] Telegram provider connection and delivery.
- [ ] ClamAV or approved malware scanning.

## 7. Security and operations

- [ ] Rotate all secrets and confirm they are absent from Git/logs.
- [ ] Confirm rate limits and origin checks on every mutation.
- [ ] Confirm account deletion and retention behavior.
- [ ] Confirm backup/restore, incident response, and monitoring alerts.
- [ ] Run a security review and penetration test.
- [ ] Record CPU, memory, latency, inode, and cron measurements.

## 8. Release decision

Do not mark production ready until every item above has recorded evidence. Mock mode is not production acceptance.
