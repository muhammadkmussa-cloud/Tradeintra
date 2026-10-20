# Monitoring and Observability

## 1. Application

- request rate, latency, error rate;
- authentication failures and suspicious patterns;
- API dependency latency;
- database errors/pool saturation;
- DB job queue errors.

## 2. Jobs and cron

- DB job queue depth;
- oldest queued job;
- job duration;
- retry/failure rate;
- cron tick success and last run;
- dead-letter count;
- stuck jobs.

## 3. Publishing and releases

- publish success/failure rate;
- time to publish;
- publish/release failures by category;
- rollback frequency;
- release upload/activation failures;
- quota rejections.

## 4. Domains

- search volume and provider errors;
- quote-to-purchase conversion;
- purchase success/failure rate;
- price-mismatch rate;
- registration latency;
- DNS pending duration;
- SSL pending duration;
- renewal success/failure;
- expiry warnings;
- refund/credit events.

## 5. Payments and earnings

- checkout conversion;
- webhook lag/failure;
- subscription state changes;
- failed payments;
- credit ledger anomalies;
- commission reconciliation variance;
- payout queue age.

## 6. Deriv

- mock/live mode status;
- OAuth success/failure (live);
- WebSocket connect/reconnect rate;
- rate-limit responses;
- token expiry/revocation;
- simulated-data label coverage.

## 7. AI and Telegram

- generation success/failure;
- credit spend per action;
- provider latency/errors;
- unsafe-output blocks;
- Telegram delivery failures (phase 2).

## 8. Security

- cross-tenant denied attempts;
- privilege changes;
- domain ownership/assignment changes;
- secret-scan hits;
- MCP calls by scope and outcome;
- suspicious uploads.

## 9. Logging rules

- structured logs;
- correlation IDs;
- redact tokens, OTPs, registrar contacts, payment data, and secrets;
- restrict access;
- set retention.

## 10. Alerts

Set thresholds after baseline. Alerts must be actionable, routed to an owner, and tested. Avoid alerting on every transient event.
