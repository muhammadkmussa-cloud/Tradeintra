-- Domain, commission, marketplace, signal, and payout ledger tables.
-- PostgreSQL 10 syntax. Provider calls remain behind adapters.

CREATE TABLE IF NOT EXISTS tradeintra_studio.domain_price_rules (
  tld text PRIMARY KEY,
  registration_price numeric(12,2) NOT NULL CHECK (registration_price >= 0),
  renewal_price numeric(12,2) NOT NULL CHECK (renewal_price >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'KES')),
  markup_percent numeric(5,2) NOT NULL DEFAULT 15 CHECK (markup_percent >= 0),
  last_verified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO tradeintra_studio.domain_price_rules (tld, registration_price, renewal_price)
VALUES
  ('.com', 12.50, 14.00),
  ('.org', 13.00, 15.00),
  ('.net', 13.50, 15.50),
  ('.co', 25.00, 27.00),
  ('.io', 89.00, 99.00),
  ('.app', 16.00, 18.00),
  ('.dev', 16.00, 18.00),
  ('.site', 9.50, 11.00),
  ('.store', 28.00, 30.00)
ON CONFLICT (tld) DO NOTHING;

CREATE TABLE IF NOT EXISTS tradeintra_studio.domains (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  site_id uuid,
  FOREIGN KEY (account_id, site_id) REFERENCES tradeintra_studio.sites(account_id, id) ON DELETE SET NULL,
  name text NOT NULL UNIQUE,
  mode text NOT NULL CHECK (mode IN ('purchased', 'connected')),
  status text NOT NULL DEFAULT 'dns_pending' CHECK (status IN ('quoted', 'registered', 'dns_pending', 'ssl_pending', 'active', 'expired', 'suspended')),
  registration_price numeric(12,2) NOT NULL DEFAULT 0,
  renewal_price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'KES')),
  premium boolean NOT NULL DEFAULT false,
  auto_renew boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  dns_verified boolean NOT NULL DEFAULT false,
  ssl_status text NOT NULL DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'issued', 'active', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS domains_account ON tradeintra_studio.domains(account_id);
CREATE INDEX IF NOT EXISTS domains_site ON tradeintra_studio.domains(account_id, site_id);

CREATE TABLE IF NOT EXISTS tradeintra_studio.domain_orders (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  domain text NOT NULL,
  years integer NOT NULL CHECK (years BETWEEN 1 AND 10),
  quoted_price numeric(12,2) NOT NULL,
  final_price numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted', 'paid', 'submitted', 'succeeded', 'failed', 'refunded')),
  provider text NOT NULL DEFAULT 'mock' CHECK (provider IN ('mock', 'namecheap', 'manual')),
  idempotency_key text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS domain_orders_account ON tradeintra_studio.domain_orders(account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tradeintra_studio.commission_entries (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  site_id uuid,
  FOREIGN KEY (account_id, site_id) REFERENCES tradeintra_studio.sites(account_id, id) ON DELETE SET NULL,
  period text NOT NULL,
  gross_commission numeric(12,2) NOT NULL CHECK (gross_commission >= 0),
  platform_share numeric(12,2) NOT NULL CHECK (platform_share >= 0),
  status text NOT NULL DEFAULT 'imported' CHECK (status IN ('estimated', 'imported', 'settled', 'reversed')),
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (account_id, site_id) REFERENCES tradeintra_studio.sites(account_id, id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS commission_entries_account ON tradeintra_studio.commission_entries(account_id, period);

CREATE TABLE IF NOT EXISTS tradeintra_studio.seller_profiles (
  account_id uuid PRIMARY KEY REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  kind text NOT NULL DEFAULT 'seller' CHECK (kind IN ('seller', 'signal_provider', 'both')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  payout_method text CHECK (payout_method IN ('mpesa', 'bank', 'crypto')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.marketplace_listings (
  id uuid PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES tradeintra_studio.seller_profiles(account_id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('bot', 'pdf', 'course', 'signal')),
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'sold', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.marketplace_orders (
  id uuid PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES tradeintra_studio.marketplace_listings(id),
  buyer_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES tradeintra_studio.seller_profiles(account_id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  platform_fee numeric(12,2) NOT NULL,
  seller_share numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded', 'disputed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.signal_orders (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES tradeintra_studio.seller_profiles(account_id) ON DELETE SET NULL,
  name text NOT NULL,
  interval text NOT NULL,
  telegram text NOT NULL,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('draft', 'building', 'trial', 'active', 'paused', 'cancelled', 'expired')),
  trial_ends_at timestamptz NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 8.99,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.signal_deliveries (
  id uuid PRIMARY KEY,
  signal_order_id uuid NOT NULL REFERENCES tradeintra_studio.signal_orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.earnings_ledger (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('partner', 'markup', 'domain', 'credits', 'marketplace', 'signals', 'referral')),
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'reversed')),
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.payouts (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL CHECK (method IN ('mpesa', 'bank', 'crypto')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'review', 'approved', 'paid', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
