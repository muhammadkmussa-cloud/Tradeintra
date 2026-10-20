-- Local/staging MVP schema, separate from diagnostic fixtures. PostgreSQL 10 syntax.
CREATE SCHEMA IF NOT EXISTS tradeintra_studio;
CREATE TABLE IF NOT EXISTS tradeintra_studio.credentials (
 id uuid PRIMARY KEY, email text NOT NULL UNIQUE, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.accounts (
 id uuid PRIMARY KEY REFERENCES tradeintra_studio.credentials(id), workspace text NOT NULL, deriv_linked boolean NOT NULL DEFAULT false, revision integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.sessions (
 token_hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES tradeintra_studio.credentials(id), expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.sites (
 account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id), id uuid NOT NULL, draft jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), published_version integer, archived boolean NOT NULL DEFAULT false,
 PRIMARY KEY(account_id,id)
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.versions (
 account_id uuid NOT NULL, site_id uuid NOT NULL, id uuid NOT NULL, number integer NOT NULL CHECK(number > 0), config jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), restored_from integer, PRIMARY KEY(account_id,site_id,number), UNIQUE(id),
 FOREIGN KEY(account_id,site_id) REFERENCES tradeintra_studio.sites(account_id,id)
);
-- Internal routing reservations: never exposed as a list or trusted for identity.
CREATE TABLE IF NOT EXISTS tradeintra_studio.subdomains (
 slug text PRIMARY KEY CHECK(slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'), account_id uuid NOT NULL, site_id uuid NOT NULL,
 FOREIGN KEY(account_id,site_id) REFERENCES tradeintra_studio.sites(account_id,id)
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.operations (
 account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id), id uuid NOT NULL, request_hash text NOT NULL, kind text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(account_id,id)
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.rate_limits (
 key text NOT NULL, window_start bigint NOT NULL, attempts integer NOT NULL, PRIMARY KEY(key,window_start)
);
CREATE INDEX IF NOT EXISTS studio_session_expiry ON tradeintra_studio.sessions(expires_at);
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['accounts','sites','versions','operations'] LOOP
  EXECUTE format('ALTER TABLE tradeintra_studio.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE tradeintra_studio.%I FORCE ROW LEVEL SECURITY',t);
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename=t AND policyname='account_isolation') THEN
   EXECUTE format('CREATE POLICY account_isolation ON tradeintra_studio.%I USING(%I = NULLIF(current_setting(''tradeintra.account_id'',true),'''')::uuid) WITH CHECK(%I = NULLIF(current_setting(''tradeintra.account_id'',true),'''')::uuid)',t,CASE WHEN t='accounts' THEN 'id' ELSE 'account_id' END,CASE WHEN t='accounts' THEN 'id' ELSE 'account_id' END);
  END IF;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION tradeintra_studio.immutable_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Published versions are immutable' USING ERRCODE='23514'; END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='tradeintra_studio.versions'::regclass AND tgname='immutable_versions') THEN
  CREATE TRIGGER immutable_versions BEFORE UPDATE OR DELETE ON tradeintra_studio.versions FOR EACH ROW EXECUTE PROCEDURE tradeintra_studio.immutable_version();
 END IF;
END $$;
