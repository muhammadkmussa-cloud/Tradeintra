CREATE TABLE IF NOT EXISTS tradeintra_studio.domain_transfer_requests (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  domain_name text NOT NULL,
  note text,
  encrypted_auth_code text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS domain_transfer_requests_account
  ON tradeintra_studio.domain_transfer_requests(account_id, created_at DESC);

ALTER TABLE tradeintra_studio.domain_transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.domain_transfer_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS domain_transfer_requests_account ON tradeintra_studio.domain_transfer_requests;
CREATE POLICY domain_transfer_requests_account ON tradeintra_studio.domain_transfer_requests FOR ALL
  USING (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.admin', true) = 'true'
  )
  WITH CHECK (
    account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid
    OR current_setting('tradeintra.admin', true) = 'true'
  );
