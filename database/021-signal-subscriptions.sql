-- Signal subscription billing fields and provider share.
ALTER TABLE tradeintra_studio.signal_orders
  ADD COLUMN IF NOT EXISTS paid_until timestamptz,
  ADD COLUMN IF NOT EXISTS platform_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_share numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_reference text;

-- Webhooks settle signal purchases using the service scope.
DROP POLICY IF EXISTS signal_orders_account ON tradeintra_studio.signal_orders;
CREATE POLICY signal_orders_account ON tradeintra_studio.signal_orders FOR ALL
  USING (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
  )
  WITH CHECK (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
  );

DROP POLICY IF EXISTS earnings_ledger_account ON tradeintra_studio.earnings_ledger;
CREATE POLICY earnings_ledger_account ON tradeintra_studio.earnings_ledger FOR ALL
  USING (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.admin', true) = 'true'
    OR current_setting('tradeintra.service', true) = 'true'
  )
  WITH CHECK (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.admin', true) = 'true'
    OR current_setting('tradeintra.service', true) = 'true'
  );
