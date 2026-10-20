# cPanel release deployment

**Status:** Packaging and local standalone startup verified. Actual Stellar Plus/Passenger startup, PostgreSQL 10, DNS, SSL, and cron remain unverified.

## 1. Build off-host

Build on a machine with the repository's Node version, then create the minimal release:

```sh
npm ci
npm run package:cpanel
```

The release is written to `dist/cpanel`. It contains:

- `server.js` and the traced standalone runtime;
- `cpanel-start.js` (startup guard and generated server entry);
- `.next/static`, `public`, and `database/`;
- a minimal `package.json`, `RELEASE.json`, and no source-only `server.cjs`.

Do not upload `.git`, `.env*`, `node_modules` from the checkout, tests, documentation, or local PGlite data. Do not run cPanel's “Run NPM Install” on the release; the traced runtime is already included.

## 2. cPanel Node.js application

Create a Node.js application whose application root is the uploaded release directory, outside `public_html`.

| Field           | Value                                    |
| --------------- | ---------------------------------------- |
| Startup file    | `cpanel-start.js`                        |
| Node version    | 22.15+ (verify the host offers it)       |
| Application URL | approved staging or production host      |
| Environment     | set through cPanel; never commit secrets |

Common values:

```text
DERIV_MODE=mock
FEATURE_LIVE_DERIV=false
FEATURE_PAYMENT_AGENT=false
APP_URL=https://approved-host
TENANT_HOST_SUFFIX=tradeintra.com
TENANT_CUSTOM_HOSTS=true
```

Set `TENANT_CUSTOM_HOSTS=true` only when custom-domain routing is approved. Without it, custom-domain rows are ignored. Published tenant routing also requires an enabled studio mode; with `STUDIO_ENABLED=false` the control plane and `/api/health` work, but tenant hosts return 404. The current production account mode is not approved, so treat tenant routing as staging-only.

For an approved **staging** account database only:

```text
STUDIO_DB_MODE=postgres
STUDIO_ENV=staging
STUDIO_ENABLED=true
DATABASE_URL=<secure value>
```

Production account mode is not approved. For production until that approval, set `STUDIO_ENABLED=false` and leave `STUDIO_DB_MODE` unset.

## 3. Database migrations

Run migrations through an approved SSH/CLI step from a source checkout with dev dependencies:

```sh
npm run studio:migrate -- --apply
```

The npm script auto-loads an optional private `.env.studio`. Because cPanel application variables are not reliably inherited by SSH, export the same variables in the shell or use a mode-`0600` `.env.studio` in the source checkout.

Migrations never run on build, startup, or HTTP requests. Apply `002-studio.sql`, `003-slug-hardening.sql`, `005-host-mappings.sql`, `006-host-mapping-canonical.sql`, and `007-host-mapping-rls.sql`; the runner executes them in order in one transaction. Back up the database before applying.

Custom domains require an active row in `tradeintra_studio.host_mappings`:

```sql
BEGIN;
SELECT set_config('tradeintra.account_id', '<account-uuid>', true);
INSERT INTO tradeintra_studio.host_mappings (hostname, account_id, site_id, status)
VALUES ('operator.example', '<account-uuid>', '<site-uuid>', 'active');
COMMIT;
```

The scoped transaction satisfies RLS. A privileged provisioning role may insert directly; do not expose writes to tenant code.

Use canonical lowercase hostnames with no port or trailing dot. `pending` and `suspended` mappings do not serve traffic.

## 4. Activate and roll back

1. Upload the release to a versioned folder. Do not run npm install.
2. Run migrations.
3. Point the Node.js application at the new `cpanel-start.js`.
4. Restart the application.
5. Check `/api/health`, the control plane, and a published mock tenant.
6. Keep the previous release folder.

Rollback: repoint the application to the previous release and restart. Database migrations must remain backward-compatible.

## 5. Boundaries

- `/api/health` is liveness, not database or SSL readiness.
- The release does not provision DNS, SSL, cron, or Namecheap domains.
- No `X-Forwarded-Host` trust; the upstream must preserve `Host`.
- PGlite is development-only and is excluded from the standalone release; `STUDIO_DB_MODE=local` is refused there.
