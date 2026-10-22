DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'domains','domain_orders','domain_contacts','commission_entries',
    'bots','bot_generation_jobs'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'tradeintra_studio'
        AND tablename = t
        AND policyname = 'service_full_access'
    ) THEN
      EXECUTE format(
        'CREATE POLICY service_full_access ON tradeintra_studio.%I FOR ALL USING (current_setting(''tradeintra.service'', true) = ''true'') WITH CHECK (current_setting(''tradeintra.service'', true) = ''true'')',
        t
      );
    END IF;
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS tradeintra_studio.deletion_tombstones (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL,
  purged_at timestamptz NOT NULL DEFAULT now()
);
