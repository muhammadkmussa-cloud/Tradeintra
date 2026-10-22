DROP POLICY IF EXISTS audit_events_account ON tradeintra_studio.audit_events;
CREATE POLICY audit_events_account ON tradeintra_studio.audit_events FOR ALL
  USING (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.admin', true) = 'true'
  )
  WITH CHECK (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.admin', true) = 'true'
  );
