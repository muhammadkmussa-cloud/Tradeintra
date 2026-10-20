-- RLS for existing host_mappings tables. Public reads resolve hosts; writes stay account-scoped.
ALTER TABLE tradeintra_studio.host_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.host_mappings FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'tradeintra_studio'
      AND tablename = 'host_mappings'
      AND policyname = 'host_mappings_public_read'
  ) THEN
    CREATE POLICY host_mappings_public_read
      ON tradeintra_studio.host_mappings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'tradeintra_studio'
      AND tablename = 'host_mappings'
      AND policyname = 'host_mappings_account_write'
  ) THEN
    CREATE POLICY host_mappings_account_write
      ON tradeintra_studio.host_mappings FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
END $$;
