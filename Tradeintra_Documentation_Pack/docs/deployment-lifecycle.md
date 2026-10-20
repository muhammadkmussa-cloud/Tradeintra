# Platform Publish and Release Lifecycle

**Status:** Proposed for Namecheap Stellar Plus. Implementation has not started.

## 1. Lifecycle types

| Type | What happens | Runtime |
|---|---|---|
| Control-plane release | Upload new app release, migrate, restart cPanel Node app | Shared Node.js |
| Tenant publish | Save immutable config, verify hostname/SSL, render | Shared runtime |
| Domain order | Namecheap API/manual, DNS, cPanel addon domain, SSL | cPanel/Namecheap |
| Background job | DB queue row processed by cron | cPanel cron |

There is **no per-customer deployment** and no separate Node process per site.

## 2. Tenant publish

1. User saves a draft configuration.
2. API validates:
   - schema;
   - module compatibility;
   - required disclosures;
   - plan entitlements;
   - site ownership;
   - hostname/domain readiness.
3. API creates an immutable `SiteConfigVersion`.
4. API marks it published and updates the current pointer.
5. Invalidate the tenant cache.
6. Verify the live hostname:
   - correct tenant;
   - correct config version;
   - HTTPS;
   - assets load.
7. Show the live URL only after verification.

A failure leaves the previous published version live.

## 3. Control-plane release

1. Build the Next.js app locally/CI.
2. Test and produce an immutable release.
3. Upload to a versioned folder on Stellar Plus.
4. Run migrations through a controlled CLI/SSH step.
5. Point the cPanel Node.js app to the new release.
6. Restart the Node.js application.
7. Run health checks and tenant smoke tests.
8. Keep the previous release for rollback.

### Rollback

- Repoint to the previous release folder and restart.
- Migrations must be backward-compatible or have a tested rollback.
- Record the rollback and reason.

## 4. Domain lifecycle

```
draft → quoted → paid → submitted → in_progress → succeeded
```

Domain attachment:

```
registered → dns_pending → ssl_pending → active
```

Failure:

```
failed | expired | suspended
```

A domain is not shown as live until DNS and SSL are verified.

## 5. Job lifecycle

```
queued → running → succeeded
                  → failed → retry/queued
                  → timed_out
```

Rules:

- durable row before execution;
- lease/lock to prevent overlap;
- idempotency key;
- bounded attempts;
- short execution window;
- stuck-job detection;
- redacted logs.

## 6. SSL lifecycle

```
not_requested → pending → issued → active
                         → failed → retry/manual
```

- cPanel AutoSSL first.
- Wildcard certificate if AutoSSL cannot cover `*.tradeintra.com`.
- Verify renewal.
- Do not claim HTTPS is ready until the certificate serves the hostname.

## 7. Logs and status

- Publish status: draft, validating, published, failed.
- Domain status: registered, DNS pending, SSL pending, active, expired.
- Job status: queued, running, succeeded, failed, timed out.
- Logs redact tokens, contacts, payment data, and secrets.
- Access limited to owner/support.

## 8. Quotas and cost controls

- Max published sites per plan.
- Max storage per account and inode usage.
- Max upload size/count.
- Max jobs per hour and cron runtime.
- Domain searches/purchases per hour.
- AI credits/concurrency (when enabled).
- Log/artifact retention.

## 9. Failure messages

- “The domain is connected but DNS has not propagated yet.”
- “SSL is still being issued. We will retry automatically.”
- “The published configuration is invalid. Review the highlighted module.”
- “The release failed health checks; the previous release is still live.”
- “The requested operation exceeds the hosting limit.”

Do not expose stack traces, database errors, or secrets.

## 10. Acceptance criteria

- [ ] Publish creates an immutable version and a live tenant.
- [ ] Failed publish leaves the previous version live.
- [ ] Release upload/restart/rollback works.
- [ ] Domain DNS/SSL states are accurate.
- [ ] Jobs run via cron and do not overlap.
- [ ] Logs are redacted and access-controlled.
- [ ] Quotas are enforced.
- [ ] Tenant isolation passes.
