-- Custom-domain routing metadata. Public reads are deliberately unscoped;
-- tenant data still loads through an account-scoped transaction.
CREATE TABLE IF NOT EXISTS tradeintra_studio.host_mappings (
  hostname text PRIMARY KEY,
  account_id uuid NOT NULL,
  site_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  CONSTRAINT host_mappings_canonical_hostname CHECK (
    hostname = lower(hostname)
    AND char_length(hostname) <= 253
    AND hostname ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (account_id, site_id) REFERENCES tradeintra_studio.sites(account_id, id)
);
CREATE INDEX IF NOT EXISTS host_mappings_site
  ON tradeintra_studio.host_mappings(account_id, site_id);

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
