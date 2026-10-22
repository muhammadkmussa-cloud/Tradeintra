DROP POLICY IF EXISTS signal_deliveries_account ON tradeintra_studio.signal_deliveries;
CREATE POLICY signal_deliveries_account ON tradeintra_studio.signal_deliveries FOR ALL
  USING (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
  )
  WITH CHECK (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.service', true) = 'true'
  );
