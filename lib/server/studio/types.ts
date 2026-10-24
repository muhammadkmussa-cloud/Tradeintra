import type { ColumnType, Generated, Kysely, Transaction } from "kysely";
import type { Config } from "../../studio";
export interface StudioDatabase {
  credentials: {
    id: string;
    email: string;
    password_hash: string;
    full_name: string | null;
    email_verified_at: Date | null;
    referral_code: string | null;
    referred_by: string | null;
    role: "user" | "support" | "finance" | "super_admin" | "service";
    created_at: Generated<Date>;
  };
  accounts: {
    id: string;
    workspace: string;
    deriv_linked: boolean;
    revision: number;
  };
  sessions: {
    token_hash: string;
    account_id: string;
    expires_at: Date;
    created_at: Generated<Date>;
  };
  sites: {
    account_id: string;
    id: string;
    draft: Config;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    published_version: number | null;
    archived: Generated<boolean>;
  };
  versions: {
    account_id: string;
    site_id: string;
    id: string;
    number: number;
    config: Config;
    created_at: Generated<Date>;
    restored_from: number | null;
  };
  subdomains: { slug: string; account_id: string; site_id: string };
  host_mappings: {
    hostname: string;
    account_id: string;
    site_id: string;
    status: "pending" | "active" | "suspended";
    created_at: Generated<Date>;
  };
  email_verifications: {
    token_hash: string;
    account_id: string;
    expires_at: Date;
    used_at: Date | null;
    created_at: Generated<Date>;
  };
  password_resets: {
    token_hash: string;
    account_id: string;
    expires_at: Date;
    used_at: Date | null;
    created_at: Generated<Date>;
  };
  auth_identities: {
    provider: "google";
    provider_account_id: string;
    account_id: string;
    email: string;
    created_at: Generated<Date>;
  };
  referrals: {
    id: string;
    referrer_id: string;
    referee_id: string;
    code: string;
    reward_credits: Generated<number>;
    status: "pending" | "rewarded" | "rejected";
    created_at: Generated<Date>;
    rewarded_at: Date | null;
  };
  credit_ledger: {
    id: string;
    account_id: string;
    delta: number;
    reason: string;
    reference: string | null;
    created_at: Generated<Date>;
  };
  deriv_oauth_states: {
    state_hash: string;
    site: string;
    code_verifier: string;
    return_path: string;
    created_at: Generated<Date>;
    expires_at: Date;
    used_at: Date | null;
  };
  deriv_trader_sessions: {
    id: string;
    token_hash: string;
    site: string;
    mode: "mock" | "demo" | "real";
    encrypted_token: string | null;
    email: string | null;
    account_id: string | null;
    account_login: string | null;
    account_currency: string | null;
    created_at: Generated<Date>;
    expires_at: Date;
    last_seen_at: Generated<Date>;
    revoked_at: Date | null;
  };
  deriv_links: {
    account_id: string;
    mode: "mock" | "sandbox" | "live";
    status: "linked" | "expired" | "revoked";
    external_account_id: string | null;
    encrypted_token: string | null;
    linked_at: Generated<Date>;
    revoked_at: Date | null;
  };
  operations: {
    account_id: string;
    id: string;
    request_hash: string;
    kind: string;
    created_at: Generated<Date>;
  };
  rate_limits: {
    key: string;
    window_start: ColumnType<string, string, string>;
    attempts: number;
  };
}
export type StudioDatabaseWithCommerce = StudioDatabase &
  CommerceDatabase &
  PaymentDatabase;
export type StudioDb = Kysely<StudioDatabaseWithCommerce>;
export type StudioTrx = Transaction<StudioDatabaseWithCommerce>;
export type Actor = {
  id: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
  referralCode: string | null;
  role: "user" | "support" | "finance" | "super_admin" | "service";
};
export class StudioError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED",
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export interface CommerceDatabase {
  domain_price_rules: {
    tld: string;
    registration_price: string;
    renewal_price: string;
    currency: "USD" | "KES";
    markup_percent: string;
    last_verified_at: Date | null;
    updated_at: Generated<Date>;
  };
  domains: {
    id: string;
    account_id: string;
    site_id: string | null;
    name: string;
    mode: "purchased" | "connected";
    status:
      | "quoted"
      | "registered"
      | "dns_pending"
      | "ssl_pending"
      | "active"
      | "expired"
      | "suspended";
    registration_price: string;
    renewal_price: string;
    currency: "USD" | "KES";
    premium: boolean;
    auto_renew: boolean;
    expires_at: Date;
    dns_verified: boolean;
    ssl_status: "pending" | "issued" | "active" | "failed";
    verification_token: string | null;
    last_checked_at: Date | null;
    verification_error: string | null;
    created_at: Generated<Date>;
  };
  domain_contacts: {
    id: string;
    account_id: string;
    domain_name: string;
    encrypted_contact: string;
    created_at: Generated<Date>;
  };
  domain_orders: {
    id: string;
    account_id: string;
    domain: string;
    years: number;
    quoted_price: string;
    final_price: string;
    status:
      "quoted" | "paid" | "submitted" | "succeeded" | "failed" | "refunded";
    provider: "mock" | "namecheap" | "manual";
    idempotency_key: string;
    note: string | null;
    created_at: Generated<Date>;
  };
  commission_entries: {
    id: string;
    account_id: string;
    site_id: string | null;
    period: string;
    gross_commission: string;
    platform_share: string;
    status:
      | "estimated"
      | "imported"
      | "settled"
      | "reversed"
      | "submitted"
      | "approved"
      | "rejected";
    provider_reference: string | null;
    statement_name: string | null;
    statement_sha256: string | null;
    statement_csv: string | null;
    submitted_at: Date | null;
    reviewed_at: Date | null;
    reviewer_note: string | null;
    created_at: Generated<Date>;
  };
  seller_profiles: {
    account_id: string;
    display_name: string;
    kind: "seller" | "signal_provider" | "both";
    status: "pending" | "approved" | "suspended";
    payout_method: "mpesa" | "bank" | "crypto" | null;
    created_at: Generated<Date>;
  };
  marketplace_listings: {
    id: string;
    seller_id: string;
    title: string;
    kind: "bot" | "pdf" | "course" | "signal";
    price: string;
    status: "draft" | "live" | "sold" | "suspended";
    delivery_content: string | null;
    delivery_filename: string | null;
    delivery_asset_key: string | null;
    delivery_size: number | null;
    delivery_mime: string | null;
    delivery_upload_id: string | null;
    created_at: Generated<Date>;
  };
  telegram_connections: {
    account_id: string;
    bot_token_encrypted: string;
    chat_id: string;
    status: "linked" | "revoked";
    created_at: Generated<Date>;
  };
  marketplace_uploads: {
    id: string;
    account_id: string;
    asset_key: string;
    filename: string;
    mime: string;
    size: number;
    scan_status: "basic-clean" | "clamav-clean" | "unscanned";
    scan_engine: string;
    created_at: Generated<Date>;
  };
  support_tickets: {
    id: string;
    account_id: string;
    subject: string;
    category: "account" | "domain" | "site" | "billing" | "abuse";
    status: "open" | "waiting" | "closed";
    created_at: Generated<Date>;
  };
  support_messages: {
    id: string;
    ticket_id: string;
    account_id: string;
    author: "customer" | "support";
    body: string;
    created_at: Generated<Date>;
  };
  announcements: {
    id: string;
    account_id: string;
    title: string;
    body: string;
    target: string;
    status: "draft" | "published";
    created_at: Generated<Date>;
  };
  deletion_requests: {
    account_id: string;
    requested_at: Date;
    execute_after: Date;
    status: "pending" | "cancelled" | "completed";
  };
  audit_events: {
    id: string;
    account_id: string;
    actor_id: string | null;
    action: string;
    detail: string;
    created_at: Generated<Date>;
  };
  bots: {
    id: string;
    account_id: string;
    name: string;
    xml: string;
    compatibility: "standard-dbot" | "tradeintra-only";
    status: "draft" | "validated" | "assigned" | "failed";
    site_id: string | null;
    created_at: Generated<Date>;
  };
  bot_generation_jobs: {
    id: string;
    account_id: string;
    prompt: string;
    status: "queued" | "generating" | "verifying" | "succeeded" | "failed";
    credits: number;
    provider: string | null;
    model: string | null;
    bot_id: string | null;
    error: string | null;
    created_at: Generated<Date>;
  };
  marketplace_orders: {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    amount: string;
    platform_fee: string;
    seller_share: string;
    status: "paid" | "refunded" | "disputed";
    downloaded_at: Date | null;
    created_at: Generated<Date>;
  };
  signal_orders: {
    id: string;
    account_id: string;
    provider_id: string | null;
    name: string;
    interval: string;
    telegram: string;
    status:
      | "draft"
      | "building"
      | "trial"
      | "active"
      | "paused"
      | "cancelled"
      | "expired";
    trial_ends_at: Date;
    price: string;
    paid_until: Date | null;
    platform_fee: string;
    seller_share: string;
    provider_reference: string | null;
    created_at: Generated<Date>;
  };
  signal_deliveries: {
    id: string;
    signal_order_id: string;
    account_id: string | null;
    status: "pending" | "sent" | "failed" | "skipped";
    message: string;
    created_at: Generated<Date>;
  };
  earnings_ledger: {
    id: string;
    account_id: string;
    source:
      | "partner"
      | "markup"
      | "domain"
      | "credits"
      | "marketplace"
      | "signals"
      | "referral";
    amount: string;
    status: "pending" | "available" | "paid" | "reversed";
    reference: string | null;
    created_at: Generated<Date>;
  };
  payouts: {
    id: string;
    account_id: string;
    amount: string;
    method: "mpesa" | "bank" | "crypto";
    status: "requested" | "review" | "approved" | "paid" | "rejected";
    created_at: Generated<Date>;
    paid_at: Date | null;
  };
}

export interface PaymentDatabase {
  credit_purchases: {
    id: string;
    account_id: string;
    pack_credits: number;
    amount: string;
    currency: "USD" | "KES";
    provider: "mock" | "paystack" | "mpesa";
    provider_reference: string;
    status: "pending" | "paid" | "failed" | "refunded";
    created_at: Generated<Date>;
    paid_at: Date | null;
  };
  email_outbox: {
    id: string;
    account_id: string;
    kind: "verification" | "reset" | "receipt" | "renewal" | "notice";
    to_email: string;
    subject: string;
    body: string;
    token: string | null;
    created_at: Generated<Date>;
  };
  signal_checkout_attempts: {
    reference: string;
    provider_reference: string | null;
    signal_order_id: string;
    account_id: string;
    provider: "mock" | "paystack" | "mpesa";
    amount: string;
    currency: string;
    status: "pending" | "paid" | "failed" | "abandoned";
    checkout_url: string | null;
    created_at: Generated<Date>;
  };
  deletion_archives: {
    id: string;
    account_id: string;
    payload: unknown;
    created_at: Generated<Date>;
  };
  provider_revocation_tasks: {
    id: string;
    account_id: string;
    provider: "deriv" | "telegram";
    status: "pending" | "done" | "failed";
    detail: string | null;
    created_at: Generated<Date>;
  };
  invoices: {
    id: string;
    account_id: string;
    kind: "credits" | "domain" | "marketplace" | "signal";
    reference: string;
    description: string;
    subtotal: string;
    tax: string;
    total: string;
    currency: string;
    status: "issued" | "refunded" | "void";
    created_at: Generated<Date>;
  };
  mfa_credentials: {
    account_id: string;
    secret_encrypted: string;
    enabled_at: Date | null;
    created_at: Generated<Date>;
  };
  domain_transfer_requests: {
    id: string;
    account_id: string;
    direction: "in" | "out";
    domain_name: string;
    note: string | null;
    encrypted_auth_code: string | null;
    status: "requested" | "approved" | "rejected" | "completed";
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
  };
  deletion_tombstones: {
    id: string;
    account_id: string;
    purged_at: Generated<Date>;
  };
  payment_events: {
    id: string;
    provider: "paystack" | "mpesa" | "mock";
    provider_event_id: string;
    purchase_id: string | null;
    payload_hash: string;
    status: "processed" | "ignored" | "failed";
    created_at: Generated<Date>;
  };
}
