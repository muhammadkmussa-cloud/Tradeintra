-- Per-provider Telegram credentials and marketplace upload metadata.
CREATE TABLE IF NOT EXISTS tradeintra_studio.telegram_connections (
  account_id uuid PRIMARY KEY REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  bot_token_encrypted text NOT NULL,
  chat_id text NOT NULL,
  status text NOT NULL DEFAULT 'linked' CHECK (status IN ('linked', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tradeintra_studio.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.telegram_connections FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='telegram_connections' AND policyname='telegram_connections_account') THEN
    CREATE POLICY telegram_connections_account ON tradeintra_studio.telegram_connections FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tradeintra_studio.marketplace_uploads (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  asset_key text NOT NULL UNIQUE,
  filename text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL CHECK (size > 0 AND size <= 5242880),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tradeintra_studio.marketplace_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.marketplace_uploads FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='marketplace_uploads' AND policyname='marketplace_uploads_account') THEN
    CREATE POLICY marketplace_uploads_account ON tradeintra_studio.marketplace_uploads FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
END $$;

ALTER TABLE tradeintra_studio.marketplace_listings
  ADD COLUMN IF NOT EXISTS delivery_upload_id uuid REFERENCES tradeintra_studio.marketplace_uploads(id) ON DELETE SET NULL;
