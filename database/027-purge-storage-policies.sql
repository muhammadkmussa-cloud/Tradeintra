DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['marketplace_listings','marketplace_uploads'] LOOP
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
