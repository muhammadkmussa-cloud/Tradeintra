CREATE TABLE IF NOT EXISTS tradeintra_studio.invoices (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('credits','domain','marketplace','signal')),
  reference text NOT NULL,
  description text NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','refunded','void')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kind, reference)
);
ALTER TABLE tradeintra_studio.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_account ON tradeintra_studio.invoices;
CREATE POLICY invoices_account ON tradeintra_studio.invoices FOR ALL
  USING (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
    OR current_setting('tradeintra.admin', true) = 'true'
  )
  WITH CHECK (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
    OR current_setting('tradeintra.admin', true) = 'true'
  );
