-- Account purge runs through the trusted service scope. The immutable-version
-- trigger still protects normal application writes.
CREATE OR REPLACE FUNCTION tradeintra_studio.immutable_version() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('tradeintra.service', true) = 'true' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Published versions are immutable' USING ERRCODE='23514';
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'accounts','sites','versions','operations','deletion_requests'
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

DROP POLICY IF EXISTS host_mappings_service ON tradeintra_studio.host_mappings;
CREATE POLICY host_mappings_service ON tradeintra_studio.host_mappings FOR ALL
  USING (current_setting('tradeintra.service', true) = 'true')
  WITH CHECK (current_setting('tradeintra.service', true) = 'true');
