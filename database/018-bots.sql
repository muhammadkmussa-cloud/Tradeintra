-- Server-backed bot library and generation jobs.
CREATE TABLE IF NOT EXISTS tradeintra_studio.bots (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  xml text NOT NULL,
  compatibility text NOT NULL DEFAULT 'standard-dbot' CHECK (compatibility IN ('standard-dbot','tradeintra-only')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','validated','assigned','failed')),
  site_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (account_id, site_id) REFERENCES tradeintra_studio.sites(account_id, id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS bots_account ON tradeintra_studio.bots(account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tradeintra_studio.bot_generation_jobs (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','generating','verifying','succeeded','failed')),
  credits integer NOT NULL,
  provider text,
  model text,
  bot_id uuid REFERENCES tradeintra_studio.bots(id) ON DELETE SET NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['bots','bot_generation_jobs'] LOOP
    EXECUTE format('ALTER TABLE tradeintra_studio.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE tradeintra_studio.%I FORCE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename=t AND policyname='account_isolation') THEN
      EXECUTE format('CREATE POLICY account_isolation ON tradeintra_studio.%I USING(account_id = NULLIF(current_setting(''tradeintra.account_id'', true), '''')::uuid) WITH CHECK(account_id = NULLIF(current_setting(''tradeintra.account_id'', true), '''')::uuid)', t);
    END IF;
  END LOOP;
END $$;
