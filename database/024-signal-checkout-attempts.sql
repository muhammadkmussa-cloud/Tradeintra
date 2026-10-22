CREATE TABLE IF NOT EXISTS tradeintra_studio.signal_checkout_attempts (
  reference text PRIMARY KEY,
  provider_reference text UNIQUE,
  signal_order_id uuid NOT NULL REFERENCES tradeintra_studio.signal_orders(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('mock', 'paystack', 'mpesa')),
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'abandoned')),
  checkout_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signal_checkout_attempts_order
  ON tradeintra_studio.signal_checkout_attempts(signal_order_id, created_at DESC);

ALTER TABLE tradeintra_studio.signal_checkout_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.signal_checkout_attempts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS signal_checkout_attempts_account ON tradeintra_studio.signal_checkout_attempts;
CREATE POLICY signal_checkout_attempts_account ON tradeintra_studio.signal_checkout_attempts FOR ALL
  USING (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
  )
  WITH CHECK (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
  );
