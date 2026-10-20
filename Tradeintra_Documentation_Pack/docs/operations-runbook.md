# Operations Runbook

Adapt to the final Namecheap Stellar Plus/cPanel/PostgreSQL setup.

## 1. Health signals

Monitor:

- control-plane availability, latency, error rate;
- database connectivity, pool, storage;
- DB job queue depth and oldest job;
- cron execution health and failed-job rate;
- cPanel/Namecheap domain API errors;
- publish success/failure rate;
- domain search/purchase/renewal failures;
- DNS/SSL pending duration;
- payment webhook failures;
- AI provider errors/spend;
- Telegram delivery failures (phase 2);
- audit/MCP anomalies.

## 2. Stellar Plus / cPanel outage

1. Confirm scope via cPanel status and health checks.
2. Keep published tenant configs available from the running app where possible.
3. Pause or queue new publishes/domain writes.
4. Show accurate status to users.
5. Avoid aggressive retries.
6. Reconcile jobs created during the outage.
7. Record impact and follow-up.

## 3. Domain purchase stuck

1. Find the `DomainOrder` by ID/idempotency key.
2. Check provider order status and local state.
3. Do not retry blindly; reconcile first.
4. If provider succeeded, assign the domain and update state.
5. If provider failed, mark failed and refund/credit.
6. If payment succeeded but registration failed, open an incident.
7. Notify the customer with a clear next step.

## 4. DNS/SSL failure

1. Check required records/nameservers.
2. Verify domain ownership.
3. Check conflicting A/AAAA/CNAME records.
4. Check wildcard `_acme-challenge` delegation.
5. Retry verification after propagation.
6. Do not mark the domain live until verified.

## 5. Renewal failure

1. Check payment method and provider status.
2. Retry per schedule.
3. Notify the customer at each stage.
4. Apply grace/expiry policy.
5. Preserve site on the platform subdomain where possible.
6. Record outcome.

## 6. Payment webhook failure

1. Verify signature and provider event ID.
2. Check idempotency store.
3. Replay from provider if safe.
4. Reconcile subscription/domain/credit state.
5. Never grant entitlement from an unverified event.

## 7. Publish or release stuck

1. Inspect persisted state, lease, and last heartbeat.
2. Review redacted logs and provider state.
3. Determine whether the process completed despite a timeout.
4. Reconcile before retry.
5. Retry only if safe/idempotent.
6. Record incident and root cause.

## 8. cPanel Node app down

1. Check whether the Node.js app is running in cPanel.
2. Review startup file, app root, Node version, and environment variables.
3. Check memory/CPU/resource limits and recent logs.
4. Restart the app.
5. If a release caused it, repoint to the previous release and restart.
6. Verify health and a tenant smoke test.
7. Record the incident and root cause.

## 9. Disk/inode limit reached

1. Check cPanel disk and inode usage.
2. Identify large tenant assets, logs, or orphaned files.
3. Clean up per retention policy with audit.
4. Stop new uploads if necessary.
5. Notify affected tenants.
6. Plan storage growth.

## 10. Suspected credential leak

1. Revoke/rotate the credential.
2. Identify exposure path.
3. Review access logs/affected resources.
4. Remove secrets from logs/artifacts where possible.
5. Assess customer impact/notification.
6. Document incident.

## 11. Data recovery

1. Identify recovery point/affected data.
2. Confirm backup integrity/permissions.
3. Restore to an isolated environment first.
4. Validate schema/tenant relationships.
5. Obtain approval before production restore.
6. Record recovery time/data-loss window.
7. Test the app after restore.

## 12. Incident record

Capture: ID, start/end, severity, affected services, user impact, detection, timeline, mitigation, root cause, data/security implications, follow-ups, owner, due date.

Never include secrets in incident notes.
