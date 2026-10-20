# cPanel staging POC runbook

**Status: harness implemented; actual Stellar Plus/Passenger/PostgreSQL 10.23/SSL/cron acceptance is UNVERIFIED.**

This is a bounded diagnostic implementation, not a production backend. It does not add customer sign-in, deploy user sites, buy domains, execute trades, or change DNS. The existing studio still stores its drafts in the browser. The optional POC runtime instead reads three explicitly seeded database snapshots.

## 1. Approval and prerequisites

Before executing any host-changing step, obtain owner approval for a **dedicated staging app, database, private storage directory, three test subdomains, and one test custom-domain alias** on the existing Namecheap Stellar Plus account. Do not purchase a service, attach a domain, or alter DNS without that approval. Configure credentials securely in cPanel or a protected environment file; never put them in chat, logs, or Git.

Requirements to verify on the real account:

- Node 22.15+ (local tests use 22.22.3), build memory, and Passenger custom-startup support.
- Database connection URL using a dedicated non-superuser role **without BYPASSRLS**. It must have CREATE on the dedicated staging database and own the POC schema, not any production/customer tables. FORCE RLS applies to the schema owner. Do not use superuser privileges as a workaround.
- Actual PostgreSQL server version and TLS requirements; use trusted certificate verification for remote connections. Do not set `rejectUnauthorized=false`.
- App directory outside `public_html`, private storage outside both the app and web roots, disk/inode/CPU/memory quotas, cron runtime limits.
- No live Deriv, payments, registrar, SMTP, or other provider credentials are needed for this POC.

PostgreSQL-in-WASM tests run locally on a newer engine. They do **not** establish wire-driver/network compatibility, PG 10 compatibility, or cPanel limits. SQL avoids features newer than PG 10, but this must be verified on the actual server.

## 2. Prepare the staging release

1. Upload source to a new staging release directory, excluding `.env*`, `.git`, `node_modules`, `.next`, browser data, test results, and unrelated artifacts. Keep the required `database/` and `scripts/` directories.
2. In the selected Node virtual environment, run `npm ci` and `npm run build`. The build uses dev dependencies; the diagnostic CLI also requires the runtime `tsx` package. If host build limits are exceeded, stop and record the failure before choosing a workaround.
3. Configure cPanel's Node application startup file to `cpanel-start.js` for a packaged standalone release, or `server.cjs` for a full source install. `npm run start:cpanel` exercises the source `server.cjs` only; the standalone release is started with `node dist/cpanel/cpanel-start.js`. It binds to `0.0.0.0`, honors a numeric `PORT`, and uses a prebuilt production Next.js app. Passenger behavior must be tested on the host; local startup is not certification.
4. Keep the previous release intact so an owner-approved restart/rollback can be performed.

## 3. Configure staging variables

Start with `.env.example`. No secrets are provided by the repository.

- `DERIV_MODE=mock`
- `FEATURE_LIVE_DERIV=false`
- `FEATURE_PAYMENT_AGENT=false`
- `POC_ENABLED=true` **only on staging**; default is false.
- `DATABASE_URL` for the dedicated staging database.
- `POC_HOSTS`: a JSON object mapping **exact canonical lowercase hostnames without ports** to `aurora`, `nova`, or `orbit`. No wildcard matching. A custom-domain alias can point to `aurora`.
- `STORAGE_ROOT`: absolute private directory outside the project and `public_html`; permissions `0700`.

Example mapping using intentionally non-public placeholder domains:

```json
{"aurora.staging.example.test":"aurora","nova.staging.example.test":"nova","orbit.staging.example.test":"orbit","custom.example.test":"aurora"}
```

Replace only with approved staging hosts. This configuration **does not provision DNS or SSL**. The allowlist and database host mapping must both agree before a tenant is returned. Changed host ownership requires explicit review; seeding refuses to silently reassign it.

For SSH/cron, cPanel app variables may not be inherited. You may store staging variables in an ignored `.env.poc` inside the private application directory with mode `0600`. CLI scripts load it if present. Alternatively export variables securely in the shell. Do not place it under a web root. The `server.cjs` startup uses cPanel's environment; to load a file locally use `node --env-file=.env.poc server.cjs`.

## 4. Explicit migration and seeding

Only after approval, against the dedicated staging database:

```sh
npm run poc:migrate -- --apply
npm run poc:seed -- --apply
```

The first command transactionally creates only `tradeintra_poc` objects. The second creates three mock accounts/sites and immutable version-1 snapshots and registers the allowlisted host mappings. Re-running the commands does not overwrite an existing snapshot. There is no automatic migration or seeding on app startup, HTTP request, or build.

This is an idempotent POC schema script, **not** a production migration ledger or general domain-management system. Existing schema drift must be reviewed; do not blindly treat `IF NOT EXISTS` as an upgrade path. No destructive rollback/drop script is supplied.

## 5. Node liveness and tenant HTTP/HTTPS

- `/api/health` returns only service status, mock mode, browser-local studio persistence, and the POC enabled flag; no database URLs, host list, credentials, filesystem paths, or versions. It is **liveness, not readiness or a database/SSL check**. It sends `Cache-Control: no-store`.
- A mapped host `/` rewrites to its own server-rendered POC tenant. It never renders the browser-local control plane on that host. Different module/color/headline configurations should be visible on the three test hosts.
- An explicit `/poc-tenant/nova` request on Aurora's host returns 404. An unmapped host cannot directly request any POC tenant. `X-Forwarded-Host` is not used to choose an account. The real upstream must preserve the validated original `Host`; if it does not, record a failed POC instead of trusting arbitrary forwarded headers.
- Public rendering loads only `versions.config` at `sites.published_version` inside an account-scoped transaction. Draft changes do not change public rendering. Missing or invalid DB state fails closed, with no sample/draft fallback.
- Check each approved hostname using HTTPS with normal certificate validation. Do **not** use `curl -k` or bypass certificate errors. Record wildcard and custom-domain certificate coverage, routing behavior, and module differences. A configuration map alone does not verify DNS/SSL.
- POC pages include mandatory risk copy, mock labels, and no-index metadata. They contain no trading or account-link operation. This is not customer publication.

## 6. DB, session-query, and file diagnostics

```sh
npm run poc:check -- --probe
```

Requires migration and seeding. Outputs redacted structured results for:

- Real server version, connection and least-privilege role check.
- Account A/B read isolation, denial without account scope, and cross-account write rejection. The attempted write is rolled back even if an unexpected policy failure allows it.
- A session/account SQL join in a transaction intentionally rolled back; **this does not implement or certify authentication**.
- Seeded published-host mapping resolution, not DNS verification.
- A temporary UUID-named text file, `0700` account directories, `0600` file mode, 64 KiB probe limit, no traversal/symlink reads, and cross-account file denial. The created file is removed in a finally block. Empty private tenant directories may remain. This is a probe store, **not a customer upload/virus-scanning/quota system**.
- Filesystem free bytes/inodes and point-in-time Node memory. These are observations, not cPanel quota or peak-load measurements.
- Whether a completed diagnostic job exists; a completion row alone does not prove the actual cron scheduler ran.

All probe rows are rolled back. No registrar, payment, email, or Deriv API is called. Keep output in an approved private log and record factual results in `progress.md`/`known-issues.md` without connection strings.

## 7. Cron proof

Explicitly enqueue one harmless diagnostic job:

```sh
npm run poc:cron -- --enqueue --apply
npm run poc:cron
```

A tick takes a transaction-scoped advisory lock, locks at most one pending diagnostic job using `FOR UPDATE SKIP LOCKED`, and marks it completed in the same transaction. Another tick returns idle; errors roll back so the next tick can retry. It cannot process customer payloads or call providers.

After the manual tick succeeds, enqueue another diagnostic job and configure the **approved** cPanel cron at a minimum five-minute interval. Use the selected absolute Node runtime and private log; for example, replace placeholders without putting secrets in the command:

```cron
*/5 * * * * cd /home/ACCOUNT/tradeintra-staging && /ABSOLUTE/NODE22/bin/node node_modules/tsx/dist/cli.mjs --env-file-if-exists=.env.poc scripts/poc-cron.ts >> /home/ACCOUNT/private/tradeintra-poc-cron.log 2>&1
```

Protect environment/log files (`0600`) and the parent directory (`0700`). The cron needs explicit staging environment configuration. Observe actual scheduler timestamps and subsequent idle ticks, check for overlap/failures, and measure host limits. Manual CLI execution is not cron acceptance.

## 8. Reproducible local built-server smoke test

No real database or hosting is needed for this negative-path test:

```sh
npm run build
# Run in a separate terminal; DATABASE_URL must be absent.
PORT=3001 POC_ENABLED=true POC_HOSTS='{"aurora.staging.example.test":"aurora","nova.staging.example.test":"nova","orbit.staging.example.test":"orbit"}' npm run start:cpanel
# In another terminal:
npm run poc:smoke -- http://127.0.0.1:3001
```

The smoke command only accepts a loopback HTTP target. It uses an actual `Host` header to verify rewrite, cross-tenant denial, ignored forwarded-host spoofing, missing-DB failure without draft/secret leakage, liveness, and the untouched control plane. It does not demonstrate a successful hosted DB render or SSL. The in-process SQL tests separately verify successful published-only configuration loading.

## 9. Record gate evidence and rollback

Keep the mandatory gate in `hosting-and-deployment-strategy.md` open until actual host evidence exists. Specifically, real account/authorization boundaries, customer uploads, password/session security, role provisioning, network driver compatibility, concurrency under a real PostgreSQL server, domain ownership, TLS, resource ceilings, cron scheduling, Passenger restart, and release rollback are not established by this harness.

To stop the POC, set `POC_ENABLED=false` and restart the approved staging app. This denies all tenant routes and returns to the browser-local studio. An application release rollback uses the preserved previous release and cPanel restart. Do not drop schemas, delete private storage, or modify DNS without separate explicit approval. Never run these diagnostics on a production/customer database.

## Later local account MVP (separate from diagnostic tenants)

The runnable account/site slice now exists; see `mvp-delivery.md`. The original diagnostic gate above remains open. The new account schema is `tradeintra_studio`, not `tradeintra_poc`; the original POC migrate/seed commands do not create account tables. On a separately approved staging DB, securely configure `STUDIO_DB_MODE=postgres`, `STUDIO_ENV=staging`, `STUDIO_ENABLED=true`, `APP_URL`, and `DATABASE_URL`, then explicitly run `npm run studio:migrate -- --apply` (optional private `.env.studio`, mode 0600). This command is not authorized for production/customer data. No hosted schema migration occurs on build/start/request.

Restrict staging access to approved testers, use synthetic emails/content, and do not assume the custom local/staging auth satisfies verification/recovery/2FA or a production audit. Account mock snapshots are accessed via same-server `/sites/slug`, not the fixture hostname map and not provisioned DNS. A normal built runtime defaults to server accounts disabled. Private local PGlite may be used explicitly for local built verification only; never run two processes on the same local directory or substitute it for the confirmed Namecheap PostgreSQL target.
