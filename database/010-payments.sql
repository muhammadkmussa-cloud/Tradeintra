-- Payment checkouts, webhook events, and idempotent credit purchases. PostgreSQL 10 syntax.
CREATE TABLE IF NOT EXISTS tradeintra_studio.credit_purchases (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  pack_credits integer NOT NULL CHECK (pack_credits > 0),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'KES')),
  provider text NOT NULL CHECK (provider IN ('mock', 'paystack', 'mpesa')),
  provider_reference text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS credit_purchases_account
  ON tradeintra_studio.credit_purchases(account_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_reference
  ON tradeintra_studio.credit_ledger(account_id, reason, reference)
  WHERE reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS tradeintra_studio.payment_events (
  id uuid PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('paystack', 'mpesa', 'mock')),
  provider_event_id text NOT NULL,
  purchase_id uuid REFERENCES tradeintra_studio.credit_purchases(id) ON DELETE SET NULL,
  payload_hash text NOT NULL,
  status text NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'ignored', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_event_id)
);
