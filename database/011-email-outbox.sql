-- Development email outbox. Production SMTP uses the same verification token flow.
CREATE TABLE IF NOT EXISTS tradeintra_studio.email_outbox (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.credentials(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('verification', 'reset', 'receipt', 'renewal', 'notice')),
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  token text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_outbox_account
  ON tradeintra_studio.email_outbox(account_id, created_at DESC);
