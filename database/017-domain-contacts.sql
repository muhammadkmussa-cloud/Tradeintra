-- Encrypted registrant contacts for purchased domains.
CREATE TABLE IF NOT EXISTS tradeintra_studio.domain_contacts (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  domain_name text NOT NULL,
  encrypted_contact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(account_id, domain_name)
);
ALTER TABLE tradeintra_studio.domain_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.domain_contacts FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='domain_contacts' AND policyname='domain_contacts_account') THEN
    CREATE POLICY domain_contacts_account ON tradeintra_studio.domain_contacts FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
END $$;
