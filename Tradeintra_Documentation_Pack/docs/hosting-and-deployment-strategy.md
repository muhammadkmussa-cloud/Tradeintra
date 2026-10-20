# Hosting and Deployment Strategy

**Status:** Owner-confirmed: Namecheap Stellar Plus shared hosting with cPanel is mandatory. Implementation has not started. The POC in Section 9 must pass before the architecture is treated as final.

## 1. Decision

Tradeintra will run on **Namecheap Stellar Plus** using:

- cPanel-managed **Node.js application** for Next.js/React;
- **PostgreSQL on Stellar Plus**;
- **local file storage** in the hosting account;
- **database-backed jobs** processed by cPanel cron;
- **Namecheap API** for domains, with manual fallback;
- cPanel/Namecheap DNS, subdomains, addon domains, SSL, and SMTP.

No VPS, Vercel, Neon, Supabase, Redis, Docker, persistent worker daemon, or per-customer Node process is a required production dependency.

## 2. Why Stellar Plus

- Owner-confirmed cost/consolidation decision.
- cPanel Node.js environment supports Node.js 6–24, app root, startup file, environment variables, NPM install, and SSH virtualenv.
- Unlimited websites, addon domains, subdomains, unmetered SSD/bandwidth.
- PostgreSQL and MariaDB available.
- cPanel wildcard subdomains, AutoSSL, email, cron, backups.
- Namecheap is also the domain registrar.

## 3. Architecture

### 3.1 One shared runtime

```
tradeintra.com / *.tradeintra.com / custom domains
                       │
                       ▼
          cPanel Node.js app (Next.js)
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   hostname        module renderer   auth/session
   → tenant        + brand kit       + account
        │
        ├─ PostgreSQL (Stellar Plus)
        ├─ local storage/{account_id}/
        └─ DB jobs → cPanel cron (5-minute tick)
```

- One Node.js process serves the control plane and all published tenant applications.
- The request hostname resolves the tenant: `slug.tradeintra.com` or a custom domain.
- Publishing writes an immutable configuration version; it does not start a process.
- No per-customer deployment or container.

### 3.2 Control-plane routes

- Marketing, registration, sign-in, account settings.
- Site/module/brand configuration.
- Preview, publish, rollback to a prior configuration.
- Domain search/purchase/connect/renewal.
- Billing, credits, announcements, support, admin.

### 3.3 Tenant routes

- Resolve hostname → tenant config.
- Render the template and enabled modules.
- Enforce tenant scope for data, files, and sessions.
- Serve only the published configuration (drafts are not public).

## 4. Components

| Concern | Launch choice |
|---|---|
| Runtime | cPanel Node.js application, supported Node version |
| Framework | Next.js + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Client state | Zustand |
| Server state | TanStack Query |
| Backend | Next.js Route Handlers + Node server |
| Database | PostgreSQL on Stellar Plus |
| Data layer | Kysely + `pg` (subject to compatibility testing) |
| Files | Local `storage/{account_id}/...` outside web root |
| Jobs | PostgreSQL `jobs` table + cPanel cron |
| Auth | Auth.js + database sessions |
| Email | cPanel/Namecheap SMTP behind an `EmailProvider` interface |
| Domains | Namecheap API behind `DomainProvider`, manual fallback |
| DNS/SSL | Namecheap DNS + cPanel AutoSSL or wildcard certificate |
| Payments | Paystack + M-Pesa adapters |
| Cache | In-process/DB cache; no Redis |
| Monitoring | cPanel/file logs; optional external monitoring only |

## 5. Hosting-specific constraints

- Cron intervals below **5 minutes** and more than **5 simultaneous cron jobs** are not allowed on shared servers.
- No persistent background daemon or unattached server process.
- Shared CPU, memory, entry-process, and inode limits apply.
- PostgreSQL is version **10.23** (EOL); avoid newer SQL features.
- No Vercel-style preview deployments, edge CDN, or instant rollback.
- Wildcard subdomain and SSL behavior must be verified on the actual account.
- cPanel API availability for automated addon-domain/subdomain creation is unverified.

## 6. Deployment and release process

### 6.1 Build

1. Build the Next.js app locally/CI.
2. Use standalone output or an equivalent upload strategy.
3. Run tests and a production build.
4. Produce an immutable release archive/folder.

### 6.2 Upload and activate

1. Upload the release to a versioned folder outside the live docroot.
2. Run database migrations through a controlled CLI/SSH step.
3. Point the cPanel Node.js app to the new release/startup file.
4. Restart the Node.js application.
5. Hit the health endpoint and a tenant smoke test.
6. Keep the previous release for rollback.

### 6.3 Rollback

- Repoint the Node.js app to the previous release folder and restart.
- Database migrations must be backward-compatible or have a tested rollback.
- No Vercel-style instant rollback.

## 7. Domain strategy

- Namecheap API is the primary integration; manual/support-assisted registration is the fallback.
- Domain pricing is fetched from the API where possible; otherwise a Super Admin price table is used.
- Registration and renewal prices are stored separately with `last_verified_at`.
- Final charge is reconciled; if it differs from the quote, the customer must confirm.
- DNS via Namecheap; domain attachment via cPanel addon domains; SSL via AutoSSL or a purchased wildcard certificate.

See `domain-management.md`.

## 8. Environment model

| Environment | Purpose | Location |
|---|---|---|
| Local | Development with mock Deriv | Local machine |
| Staging | Hosting compatibility/POC | `staging.tradeintra.com` on Stellar Plus |
| Production | Live customers | `tradeintra.com` on Stellar Plus |

Staging should use a separate database and, where possible, a separate cPanel account/subdomain. Never test destructive migrations on production.

## 9. Proof of concept gate

Before full implementation, demonstrate on the actual Stellar Plus account:

- [ ] Tradeintra itself runs via cPanel Node.js.
- [ ] `*.tradeintra.com` routes to the shared runtime.
- [ ] HTTPS works for wildcard or per-subdomain certificates.
- [ ] Three differently configured tenant applications are live on separate subdomains.
- [ ] A custom domain is attached and served over HTTPS.
- [ ] Tenant isolation passes for database, files, and routes.
- [ ] PostgreSQL 10.23 migrations, transactions, and auth queries work.
- [ ] File uploads respect disk/inode limits.
- [ ] A DB job runs via cPanel cron.
- [ ] Release upload, restart, and rollback work.
- [ ] No Vercel, Neon, Redis, or external hosting is required.
- [ ] Actual CPU/memory/inode/cron limits are measured.

If a capability fails, document the limitation before implementing a workaround.

## 10. Revisit triggers

- Wildcard routing/SSL cannot be made reliable.
- cPanel Node.js cannot run the app within resource limits.
- PostgreSQL compatibility blocks the data layer.
- Cron/job limits make required workflows impossible.
- The owner changes the hosting decision.
