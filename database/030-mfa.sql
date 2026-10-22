CREATE TABLE IF NOT EXISTS tradeintra_studio.mfa_credentials (
  account_id uuid PRIMARY KEY REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  secret_encrypted text NOT NULL,
  enabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tradeintra_studio.mfa_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.mfa_credentials FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mfa_credentials_account ON tradeintra_studio.mfa_credentials;
CREATE POLICY mfa_credentials_account ON tradeintra_studio.mfa_credentials FOR ALL
  USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
  WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
