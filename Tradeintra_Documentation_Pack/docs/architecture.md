# Architecture

**Status:** Proposed and owner-confirmed at the platform level. Namecheap Stellar Plus is mandatory. Local studio and opt-in staging harness are implemented; production architecture is not yet proven. The POC in `hosting-and-deployment-strategy.md` must pass before this is final.

## 1. Architectural model

Tradeintra is a **single shared Node.js application** on cPanel plus **PostgreSQL**, **local file storage**, and **cron-driven jobs**.

```
┌──────────────────────────────────────────────────────────────┐
│           cPanel Node.js application (Next.js)               │
│                                                              │
│  Marketing · Auth · Accounts · Sites · Templates · Modules   │
│  Brand kits · Plans · Billing · Domains · Publish · Admin    │
│  Shared tenant renderer · Preview · Announcements · Support  │
└───────────────┬───────────────────────────────┬──────────────┘
                │                               │
        ┌───────▼────────┐              ┌───────▼────────────┐
        │  PostgreSQL    │              │  Local storage     │
        │  Stellar Plus  │              │  storage/{acct}/   │
        │  RLS + tenancy │              │  outside web root  │
        └───────┬────────┘              └───────┬────────────┘
                │                               │
        ┌───────▼────────┐              ┌───────▼────────────┐
        │  jobs table    │              │  cPanel cron       │
        │  DB-backed     │◄─────────────│  every 5 minutes   │
        └───────┬────────┘              └────────────────────┘
                │
        ┌───────▼─────────────────────────────────────────────┐
        │ External APIs (not hosting dependencies)             │
        │ Namecheap · Paystack · M-Pesa · Deriv · AI (optional)│
        └──────────────────────────────────────────────────────┘
```

## 2. Runtime responsibilities

- Authentication, sessions, 2FA, recovery.
- Accounts, country, settings.
- Deriv linking state (mock/live).
- Sites, templates, brand kits, modules, configuration versions.
- Preview and publish.
- Domain search/purchase/connect/renewal.
- Plans, entitlements, credits.
- Publish/domain/SSL status.
- Announcements, support, admin, audit.
- Tenant hostname resolution and rendering.

The application must not execute arbitrary customer code.

## 3. Shared tenant runtime

- One Next.js app serves the control plane and all published applications.
- Middleware resolves the tenant from the `Host` header:
  - `slug.tradeintra.com` → subdomain slug;
  - custom domain → domain mapping;
  - `tradeintra.com` / `www` → marketing/control plane.
- Published configuration is loaded from PostgreSQL and cached in-process.
- Rendering is deterministic from the published version.
- Assets are served from tenant-scoped local storage through a controlled route.
- Drafts are never public.

## 4. Data stores

| Store | Purpose | Isolation |
|---|---|---|
| PostgreSQL (Stellar Plus) | Accounts, sites, configs, domains, orders, billing, jobs, audit | `account_id` + RLS + scoped queries |
| Local storage | Logos, favicons, uploads, bot files, backups | `storage/{account_id}/...` outside web root |
| In-process cache | Published tenant config, short-lived lookups | Keyed by tenant/domain; bounded |
| Logs | App/cron/audit | cPanel logs + redacted file logs |

No Redis, object storage, or external database is required.

## 5. Background jobs

DB-backed `jobs` table:

- `type`, `payload`, `status`, `run_after`, `locked_at`, `attempts`, `idempotency_key`.
- Cron tick every 5 minutes calls a protected internal endpoint or CLI runner.
- Jobs are short, bounded, idempotent, and retry-safe.
- No persistent worker daemon.
- Long work is split into steps.

Used for:

- domain order polling/renewal checks;
- email sending/retries;
- cleanup/retention;
- report generation;
- scheduled notifications;
- optional low-volume signal delivery later.

## 6. Domain architecture

- `DomainProvider` adapter with Namecheap implementation.
- Sandbox first; production after API access/IP whitelisting.
- Manual/support-assisted fallback.
- API pricing where available; Super Admin price table fallback.
- Price snapshots and final-charge reconciliation.
- Namecheap DNS + cPanel addon domains + AutoSSL/wildcard certificate.

See `domain-management.md`.

## 7. Deriv integration

- `DerivProvider` adapter with `mock` and `live` implementations.
- Mock mode is the only mode until approval.
- Live mode uses OAuth/PKCE server-side and OTP WebSocket URLs.
- Tokens are encrypted and never sent to tenant configuration or browsers.
- Simulated data is labelled.
- Live trading is gated by feature flag, entitlement, and approval.

See `deriv-api-reference.md`.

## 8. Payments and earnings

- Paystack and M-Pesa adapters.
- Webhooks verified and idempotent.
- Entitlements update from trusted server state.
- Domain, subscription, credit, and marketplace orders are separate.
- Earnings ledgered by source.
- No payout execution by the operations MCP.
- Payment-agent functionality deferred.

## 9. Email and notifications

- cPanel/Namecheap SMTP for the POC.
- `EmailProvider` interface for future providers.
- SPF/DKIM/DMARC configured.
- Monitor sending limits, bounces, and failures.
- In-app notifications stored in PostgreSQL.

## 10. Security boundaries

| Boundary | Control |
|---|---|
| Browser ↔ app | Auth, CSRF where applicable, rate limits |
| App ↔ PostgreSQL | Scoped queries, RLS, least-privilege DB user |
| App ↔ local storage | Path validation, tenant directories, no execution |
| Cron ↔ app | Secret/signature, IP restriction where possible |
| Support/admin ↔ customer data | Least privilege, masking, audit |
| External APIs | Scoped credentials in env vars, timeouts, retries |
| Tenant runtime ↔ tenant data | Hostname + session + `account_id` checks |

Subdomains are routing, not security.

## 11. Technology choices (proposed)

| Layer | Choice |
|---|---|
| Framework | Next.js + React + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Client state | Zustand |
| Server state | TanStack Query |
| Backend | Next.js Route Handlers + Node server |
| Hosting | Namecheap Stellar Plus / cPanel Node.js |
| Database | PostgreSQL on Stellar Plus |
| Data layer | Kysely + `pg` (compatibility-tested) |
| Files | Local storage outside web root |
| Jobs | PostgreSQL jobs + cPanel cron |
| Auth | Auth.js + DB sessions |
| Email | cPanel/Namecheap SMTP |
| Domains | Namecheap API adapter |
| Payments | Paystack + M-Pesa |
| Cache | In-process/DB; no Redis |
| Monitoring | cPanel/file logs; optional external tool |

Final library choices require dependency and PostgreSQL compatibility review.

## 12. Deliberate exclusions

- No VPS, Vercel, Neon, Supabase, Redis, Docker, or persistent worker daemon.
- No per-customer Node process.
- No arbitrary customer code execution.
- No AI-generated standalone apps in v1.
- No multi-broker support.
- No payment-agent functionality.
- No global edge/CDN assumption.

## 13. Revisit triggers

- POC fails wildcard routing, SSL, Node runtime, or PostgreSQL compatibility.
- Shared-hosting CPU/memory/inode/cron limits make the product unusable.
- The owner changes the hosting decision.
