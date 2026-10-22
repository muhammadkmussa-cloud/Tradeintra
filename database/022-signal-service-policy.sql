-- Allow trusted webhook/service scope to settle signal orders and provider earnings.
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
