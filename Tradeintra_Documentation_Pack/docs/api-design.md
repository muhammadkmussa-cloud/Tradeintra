# API Design

**Status:** Proposed resource outline. The final contract must be generated as OpenAPI and tested. This is not a final specification.

## 1. Principles

- Version public APIs (`/api/v1`).
- Validate every input server-side.
- Authenticate and authorize every protected action.
- Scope every resource to the authenticated account.
- Use idempotency keys for domain purchase, payment, publish, jobs, and releases.
- Paginate collections.
- Return safe errors with a correlation ID.
- Never expose tokens, registrar contacts, or provider secrets.
- Use a consistent JSON envelope.

## 2. Resource map

| Resource | Operations |
|---|---|
| Auth | Register, verify, sign in/out, recover, 2FA |
| Account | Read/update profile, country, delete |
| Deriv | Link (mock/live), status, revoke |
| Templates | List/read/preview |
| Modules | List/read/config schema |
| Sites | Create/list/read/update/archive/delete |
| Site config | Draft/read/validate/publish/rollback |
| Subdomains | Check/reserve/update/release |
| Domains | Search/price/read/buy/connect/verify/renew/remove |
| Publish/jobs | Publish, status, logs, rollback, job processing |
| Bots | Upload/list/read/update/delete/assign |
| Bot generation | Create/status/result |
| AI Builder | Deferred; no generated-code runtime |
| Signals | Create/update/pause/cancel/deliveries |
| Plans | List/read |
| Subscription | Read/checkout/portal/cancel |
| Credits | Balance/ledger/packs |
| Commissions | Summary/periods/entries |
| Earnings | Summary/payout methods/request |
| Announcements | CRUD/publish |
| Support | Create/list/read/reply |
| Admin | Plans/markup/templates/modules/users/audit |
| MCP | Tools/list, tools/call (separate service) |

## 3. Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/verify-email` | Verify email |
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/logout` | Sign out |
| POST | `/api/v1/auth/forgot-password` | Start recovery |
| POST | `/api/v1/auth/reset-password` | Complete recovery |
| POST | `/api/v1/auth/2fa/setup` | Start TOTP setup |
| POST | `/api/v1/auth/2fa/verify` | Confirm TOTP |
| POST | `/api/v1/auth/2fa/disable` | Disable TOTP |

Session cookies must be `HttpOnly`, `Secure`, `SameSite=Lax` (or stricter). State-changing cookie requests require CSRF protection.

## 4. Deriv

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/deriv/link/start` | Start mock/live link |
| GET | `/api/v1/deriv/link/callback` | OAuth callback |
| POST | `/api/v1/deriv/link/token` | Link with token (live only) |
| GET | `/api/v1/deriv/link` | Link status |
| POST | `/api/v1/deriv/link/revoke` | Revoke |

Responses must indicate `mode: mock|live`. Mock mode must not return real tokens.

## 5. Sites and configuration

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/templates` | List templates |
| GET | `/api/v1/templates/{key}` | Template detail |
| GET | `/api/v1/modules` | Module catalog |
| POST | `/api/v1/sites` | Create site |
| GET | `/api/v1/sites` | List owned sites |
| GET | `/api/v1/sites/{id}` | Site detail |
| PATCH | `/api/v1/sites/{id}` | Rename/update |
| DELETE | `/api/v1/sites/{id}` | Archive/delete |
| GET | `/api/v1/sites/{id}/config` | Draft config |
| PUT | `/api/v1/sites/{id}/config` | Save draft |
| POST | `/api/v1/sites/{id}/config/validate` | Validate |
| POST | `/api/v1/sites/{id}/publish` | Publish |
| POST | `/api/v1/sites/{id}/rollback` | Roll back |
| GET | `/api/v1/sites/{id}/preview` | Preview token/URL |

Publish request:

```json
{
  "config_version": 12,
  "domain_id": "dom_123",
  "idempotency_key": "publish-site-123-v12"
}
```

## 6. Subdomains

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/subdomains/check?slug=acme` | Availability |
| POST | `/api/v1/sites/{id}/subdomain` | Reserve/attach |
| DELETE | `/api/v1/sites/{id}/subdomain` | Release |

Response includes reason codes: `available`, `taken`, `reserved`, `invalid`, `abusive`.

## 7. Domains

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/domains/search` | Search domains within provider limits |
| GET | `/api/v1/domains/{name}/price?years=1` | Price |
| GET | `/api/v1/domains/{name}/availability` | Availability |
| POST | `/api/v1/domains/orders` | Create order/quote |
| POST | `/api/v1/domains/orders/{id}/checkout` | Start payment |
| GET | `/api/v1/domains/orders/{id}` | Order status |
| POST | `/api/v1/domains/connect` | Connect external domain |
| POST | `/api/v1/domains/{id}/verify` | Verify DNS |
| POST | `/api/v1/domains/{id}/renew` | Renew |
| DELETE | `/api/v1/domains/{id}` | Remove |
| GET | `/api/v1/domains` | List owned domains |

Search response:

```json
{
  "results": [
    {
      "domain": "acme.com",
      "available": true,
      "registration_price": 12.5,
      "renewal_price": 14.0,
      "currency": "USD",
      "premium": false
    }
  ]
}
```

Purchase errors must be specific: `domain_unavailable`, `price_changed`, `unsupported_tld`, `contact_invalid`, `payment_failed`, `registrar_failed`.

## 8. Publish, releases, and jobs

There is no per-customer deployment. Publishing validates configuration and updates the published pointer for the shared runtime.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/sites/{id}/publish` | Validate and publish a config version |
| GET | `/api/v1/sites/{id}/publish-events` | Publish history |
| POST | `/api/v1/sites/{id}/rollback` | Repoint to a prior published version |
| GET | `/api/v1/sites/{id}/status` | Hostname/DNS/SSL/publish status |
| GET | `/api/v1/jobs` | List jobs (admin/support) |
| GET | `/api/v1/jobs/{id}` | Job status/log |
| POST | `/api/v1/internal/jobs/tick` | Protected cron runner |
| POST | `/api/v1/admin/releases` | Upload/activate a control-plane release |
| POST | `/api/v1/admin/releases/{id}/rollback` | Roll back the Node app release |

Publish returns `202` with a durable job/event ID where work is asynchronous. The cron endpoint requires `CRON_SECRET` and should be IP-restricted where possible.

## 9. Bots

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/bots` | Upload bot |
| GET | `/api/v1/bots` | List |
| GET | `/api/v1/bots/{id}` | Detail |
| PATCH | `/api/v1/bots/{id}` | Rename/describe |
| DELETE | `/api/v1/bots/{id}` | Delete |
| POST | `/api/v1/bots/{id}/versions` | New version |
| POST | `/api/v1/bots/{id}/validate` | Validate |
| POST | `/api/v1/bots/{id}/assign` | Assign to site |
| POST | `/api/v1/bots/generate` | Create generation job |
| GET | `/api/v1/bots/generate/{jobId}` | Job status |

Uploads: size limit, XML parsing, malware scan, checksum, tenant-scoped storage.

## 10. AI Builder (deferred)

Arbitrary generated applications are not part of the launch API (`ADR 0014`). If a safe runtime is introduced later, it requires a separate design and isolation model.

## 11. Signals

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/signals/orders` | Create signal order |
| GET | `/api/v1/signals/orders` | List |
| GET | `/api/v1/signals/orders/{id}` | Status |
| PATCH | `/api/v1/signals/orders/{id}` | Update |
| POST | `/api/v1/signals/orders/{id}/pause` | Pause |
| POST | `/api/v1/signals/orders/{id}/cancel` | Cancel |
| POST | `/api/v1/telegram/connect` | Connect Telegram |
| GET | `/api/v1/signals/orders/{id}/deliveries` | Delivery log |

## 12. Billing

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/plans` | Plans |
| GET | `/api/v1/subscription` | Current subscription |
| POST | `/api/v1/subscription/checkout` | Start checkout |
| POST | `/api/v1/subscription/portal` | Billing portal |
| POST | `/api/v1/subscription/cancel` | Cancel |
| GET | `/api/v1/credits` | Balance |
| GET | `/api/v1/credits/ledger` | Ledger |
| POST | `/api/v1/credits/checkout` | Buy credits |
| POST | `/api/v1/webhooks/paystack` | Provider webhook |
| POST | `/api/v1/webhooks/mpesa` | Provider webhook |

Webhooks: verify signature, store raw event, deduplicate by provider event ID, process idempotently.

## 13. Commissions and earnings

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/commissions/summary` | Totals |
| GET | `/api/v1/commissions/entries` | Ledger |
| GET | `/api/v1/earnings/summary` | All streams |
| GET | `/api/v1/earnings/payout-methods` | Methods |
| POST | `/api/v1/earnings/payouts` | Request payout |

Payout requests are queued for a human/finance process; no MCP payout execution.

## 14. Admin

Admin endpoints require Super Admin and audit:

- `/api/v1/admin/plans`
- `/api/v1/admin/domain-price-rules`
- `/api/v1/admin/templates`
- `/api/v1/admin/modules`
- `/api/v1/admin/users`
- `/api/v1/admin/audit`
- `/api/v1/admin/support/tickets`

## 15. Error format

```json
{
  "error": {
    "code": "DOMAIN_PRICE_CHANGED",
    "message": "The domain price changed. Review the new price and confirm.",
    "request_id": "req_...",
    "details": []
  }
}
```

Do not return stack traces, SQL errors, provider secrets, registrar contacts, or internal URLs.

## 16. HTTP behavior

- `401` missing/invalid auth.
- `403` or non-disclosing `404` for unauthorized resources.
- `409` state conflict.
- `422` validation error.
- `429` rate limited with `Retry-After`.
- `202` for durable publish/domain/job work.
- Idempotent replays return the original result.

## 17. Rate limits

- Auth: strict per IP and per account.
- Domain search: per account and Namecheap API budget.
- Domain purchase: per account; idempotency required.
- Publish: per account and shared-runtime concurrency cap.
- Cron/jobs: one protected tick; bounded batch.
- AI generation: credit-checked and concurrency-limited.
- Webhooks: provider signature and replay protection.
