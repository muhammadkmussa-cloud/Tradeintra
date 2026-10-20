# Data Model

**Status:** Proposed logical model. Final schema and migrations require implementation review. Use PostgreSQL with tenant-scoped rows and row-level security where supported.

## 1. Conventions

- UUID primary keys unless a provider ID is required.
- `created_at`, `updated_at` on mutable tables.
- Soft delete only where recovery is required; otherwise hard delete with an audit event.
- Money stored as integer minor units plus currency, or `numeric(18,6)` for provider amounts.
- All tenant-owned tables include `account_id`.
- All provider calls use idempotency keys.
- Secrets and tokens are stored in a secret manager or encrypted columns, never in JSON config.

## 2. Identity

### Account
- `id`
- `email` (unique, normalized)
- `password_hash` (nullable for Google-only)
- `display_name`
- `country_code`
- `status` (`active`, `suspended`, `deleted`)
- `email_verified_at`
- `mfa_enabled`
- `referred_by_account_id` (nullable)
- `created_at`, `updated_at`, `deleted_at`

### AuthIdentity
- `id`
- `account_id`
- `provider` (`password`, `google`)
- `provider_subject`
- `created_at`

### Session
- `id`
- `account_id`
- `token_hash`
- `expires_at`
- `ip_hash`
- `user_agent_hash`
- `created_at`, `revoked_at`

### MfaCredential
- `id`
- `account_id`
- `secret_encrypted`
- `recovery_codes_hash`
- `created_at`, `last_used_at`

## 3. Deriv linkage

### DerivLink
- `id`
- `account_id` (unique at launch)
- `mode` (`mock`, `live`)
- `deriv_account_id` (nullable in mock)
- `deriv_login_id`
- `token_encrypted` (nullable)
- `token_expires_at`
- `scopes`
- `status` (`pending`, `linked`, `expired`, `revoked`)
- `linked_at`, `revoked_at`

Do not store Deriv passwords. Do not expose tokens after linking.

## 4. Templates and modules

### Template
- `id`
- `key` (unique)
- `name`
- `description`
- `version`
- `status` (`draft`, `active`, `retired`)
- `preview_asset_id`
- `created_at`, `updated_at`

### TemplateVersion
- `id`
- `template_id`
- `version`
- `schema_version`
- `pages` (JSON)
- `required_modules` (JSON)
- `created_at`

### Module
- `id`
- `key` (unique)
- `name`
- `description`
- `status`
- `latest_version`
- `created_at`, `updated_at`

### ModuleVersion
- `id`
- `module_id`
- `version`
- `schema_version`
- `config_schema` (JSON Schema)
- `compatibility` (JSON)
- `plan_requirement`
- `is_mock_safe`
- `is_generated_app_allowed`
- `created_at`

## 5. Sites

### Site
- `id`
- `account_id`
- `name`
- `slug` (unique per account; subdomain slug unique globally)
- `template_id`
- `template_version`
- `status` (`draft`, `published`, `suspended`, `archived`)
- `current_draft_version_id`
- `current_published_version_id`
- `created_at`, `updated_at`, `deleted_at`

### SiteConfigVersion
- `id`
- `site_id`
- `version_number`
- `schema_version`
- `template_key`
- `configuration` (JSON, validated)
- `created_by`
- `created_at`
- `published_at` (nullable)
- `is_published`

Unique: `(site_id, version_number)`.

### SiteAsset
- `id`
- `site_id`
- `kind` (`logo`, `favicon`, `image`, `document`, `bot_file`)
- `storage_key`
- `mime_type`
- `size_bytes`
- `checksum`
- `created_at`

### PlatformSubdomain
- `id`
- `site_id` (unique)
- `slug` (unique, case-insensitive)
- `status` (`reserved`, `active`, `suspended`)
- `created_at`, `released_at`

## 6. Domains

### Domain
- `id`
- `account_id`
- `site_id` (nullable)
- `name` (unique, normalized)
- `type` (`platform_subdomain`, `purchased`, `connected`)
- `status` (`pending`, `registered`, `dns_pending`, `ssl_pending`, `active`, `expired`, `suspended`, `failed`)
- `provider` (`namecheap`, `manual`)
- `provider_domain_id`
- `is_primary`
- `auto_renew`
- `registered_at`
- `expires_at`
- `ssl_status`
- `dns_status`
- `created_at`, `updated_at`

### DomainContact
- `id`
- `domain_id` (unique)
- `first_name`, `last_name`, `email`, `phone`
- `address1`, `address2`, `city`, `state`, `postal_code`, `country_code`
- `company_name` (nullable)
- `encrypted_payload` (for provider schema)
- `created_at`, `updated_at`

Access restricted to billing/support/Super Admin.

### DomainOrder
- `id`
- `account_id`
- `domain_name`
- `order_type` (`register`, `renew`, `transfer_in`)
- `status` (`draft`, `quoted`, `paid`, `submitted`, `in_progress`, `succeeded`, `failed`, `refunded`)
- `years`
- `currency`
- `base_price`
- `markup_amount`
- `tax_amount`
- `total_amount`
- `price_snapshot` (JSON)
- `provider_order_id`
- `idempotency_key` (unique)
- `failure_code`, `failure_summary`
- `created_at`, `updated_at`, `completed_at`

### DomainPriceRule
- `id`
- `tld`
- `markup_type` (`fixed`, `percent`, `combined`)
- `markup_value`
- `currency`
- `active`
- `updated_by`
- `updated_at`

## 7. Publishing, jobs, releases, and storage

There is no per-customer deployment record. Publishing a tenant is a configuration/version event. Long-running work is a job.

### PublishEvent
- `id`
- `account_id`
- `site_id`
- `config_version_id`
- `status` (`validating`, `published`, `failed`)
- `requested_by`
- `correlation_id`
- `failure_code`, `failure_summary`
- `created_at`, `completed_at`

### Release
- `id`
- `version`
- `artifact_path`
- `status` (`uploaded`, `migrating`, `active`, `failed`, `rolled_back`)
- `previous_release_id`
- `created_by`
- `created_at`, `activated_at`

### Job
- `id`
- `account_id` (nullable for system jobs)
- `type`
- `payload` (JSON)
- `status` (`queued`, `running`, `succeeded`, `failed`, `timed_out`)
- `run_after`
- `locked_at`
- `attempts`
- `max_attempts`
- `idempotency_key` (unique)
- `last_error_redacted`
- `created_at`, `completed_at`

### JobRun
- `id`
- `job_id`
- `started_at`
- `finished_at`
- `outcome`
- `message_redacted`

### StorageAsset
- `id`
- `account_id`
- `site_id` (nullable)
- `kind`
- `storage_key`
- `mime_type`
- `size_bytes`
- `checksum`
- `created_at`, `deleted_at`

## 8. Bots

### Bot
- `id`
- `account_id`
- `name`
- `description`
- `source` (`upload`, `generated`, `extracted`)
- `compatibility` (`standard_dbot`, `tradeintra_only`, `unknown`)
- `status` (`draft`, `verified`, `failed`, `published`)
- `current_version_id`
- `created_at`, `updated_at`

### BotVersion
- `id`
- `bot_id`
- `version`
- `xml_storage_key`
- `xml_checksum`
- `validation_status`
- `validation_errors` (JSON)
- `backtest_status`
- `backtest_summary` (JSON)
- `created_by`
- `created_at`

### BotGenerationJob
- `id`
- `account_id`
- `prompt`
- `source_url` (nullable)
- `settings` (JSON)
- `status` (`queued`, `generating`, `verifying`, `failed`, `succeeded`)
- `credits_spent`
- `result_bot_version_id`
- `created_at`, `completed_at`

### BotSiteAssignment
- `id`
- `bot_id`
- `site_id`
- `status`
- `created_at`

## 9. AI Builder (deferred)

Arbitrary AI-generated applications are **deferred** under `ADR 0014`. No generated-app runtime is part of the launch schema. If reintroduced, a separate design must define isolation, storage, and release records. Do not reuse tenant-site tables for generated code.

## 10. Signals (deferred)

### TelegramConnection
- `id`
- `account_id`
- `bot_token_encrypted`
- `channel_id`
- `channel_title`
- `status` (`pending`, `active`, `revoked`)
- `created_at`

### SignalStrategy
- `id`
- `account_id`
- `name`
- `description`
- `interval_minutes`
- `status` (`draft`, `active`, `paused`, `expired`)
- `created_at`, `updated_at`

### SignalOrder
- `id`
- `account_id`
- `strategy_id`
- `telegram_connection_id`
- `message_template`
- `status` (`draft`, `building`, `trial`, `active`, `paused`, `cancelled`, `failed`)
- `trial_ends_at`
- `subscription_id`
- `created_at`, `updated_at`

### SignalDelivery
- `id`
- `signal_order_id`
- `scheduled_at`
- `sent_at`
- `status` (`pending`, `sent`, `failed`, `skipped`)
- `payload_redacted`
- `error_code`

## 11. Plans, billing, credits

### Plan
- `id`
- `key`
- `name`
- `price_minor`
- `currency`
- `interval`
- `features` (JSON)
- `limits` (JSON)
- `active`

### Subscription
- `id`
- `account_id`
- `plan_id`
- `provider`
- `provider_subscription_id`
- `status` (`trialing`, `active`, `past_due`, `cancelled`, `expired`)
- `period_start`, `period_end`
- `cancel_at_period_end`
- `created_at`, `updated_at`

### Entitlement
- `id`
- `account_id`
- `key`
- `value`
- `source` (`plan`, `addon`, `admin`)
- `expires_at`
- `created_at`

### CreditLedger
- `id`
- `account_id`
- `delta`
- `balance_after`
- `reason` (`purchase`, `generation`, `refund`, `admin_adjustment`)
- `reference_type`, `reference_id`
- `created_at`

### Payment
- `id`
- `account_id`
- `purpose` (`subscription`, `domain`, `credits`, `marketplace`)
- `provider` (`paystack`, `mpesa`)
- `provider_reference` (unique)
- `amount_minor`
- `currency`
- `status` (`pending`, `succeeded`, `failed`, `refunded`, `partially_refunded`)
- `idempotency_key`
- `created_at`, `updated_at`

### Refund
- `id`
- `payment_id`
- `amount_minor`
- `reason`
- `status`
- `provider_reference`
- `created_at`, `completed_at`

## 12. Commissions and earnings

### CommissionEntry
- `id`
- `account_id`
- `site_id`
- `source` (`partner_commission`, `app_markup`)
- `period_start`, `period_end`
- `gross_amount`
- `platform_share`
- `account_share`
- `currency`
- `status` (`pending`, `settled`, `paid`, `disputed`)
- `provider_reference`
- `created_at`

### Payout
- `id`
- `account_id`
- `method` (`mpesa`, `bank`, `crypto`)
- `amount_minor`
- `currency`
- `status` (`requested`, `approved`, `processing`, `paid`, `failed`)
- `provider_reference`
- `created_at`, `completed_at`

Payout execution is outside the operations MCP.

## 13. Growth and support

### Announcement
- `id`
- `account_id`
- `site_id` (nullable for all sites)
- `title`
- `body`
- `status` (`draft`, `published`, `archived`)
- `published_at`
- `created_at`

### Referral
- `id`
- `referrer_account_id`
- `referred_account_id` (unique)
- `code`
- `status`
- `created_at`

### SupportTicket
- `id`
- `account_id`
- `subject`
- `status` (`open`, `pending`, `resolved`, `closed`)
- `priority`
- `created_at`, `updated_at`

### AuditEvent
- `id`
- `actor_account_id` (nullable for service)
- `actor_type` (`user`, `support`, `service`, `system`)
- `account_id` (target)
- `action`
- `resource_type`, `resource_id`
- `outcome`
- `correlation_id`
- `metadata_redacted` (JSON)
- `created_at`

## 14. Integrity rules

- Foreign keys on all relationships.
- Unique constraints on email, domain name, subdomain slug, idempotency keys, provider references.
- `SiteConfigVersion` is immutable after creation.
- Only one published version per site.
- Only one primary domain per site.
- A domain cannot belong to two sites.
- A bot version cannot be mutated after publish.
- Domain orders and payments are reconciled, never deleted.
- Audit events are append-only.

## 15. Row-level security

Enable RLS on tenant tables. Policies use the authenticated `account_id` from a trusted session context. Service roles bypass only for explicitly scoped jobs. Do not rely on RLS alone; application queries must also be scoped.

## 16. State machines

### Site
`draft → published → suspended → archived`

### Domain
`pending → registered → dns_pending → ssl_pending → active → expired/suspended`
Transitions require verified provider state.

### PublishEvent
`validating → published`
Failure: `failed`. The previous published version remains live.

### Release
`uploaded → migrating → active`
Failure: `failed`; rollback: `rolled_back` to `previous_release_id`.

### Job
`queued → running → succeeded`
Failure/timeout: `failed`, `timed_out`; retry via `queued` while attempts remain.

### DomainOrder
`draft → quoted → paid → submitted → in_progress → succeeded`
Failure: `failed → refunded`.

### SignalOrder
`draft → building → trial → active → paused/cancelled/expired`.
