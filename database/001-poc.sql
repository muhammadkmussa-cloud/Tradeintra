-- Staging-only POC schema. Execute explicitly with npm run poc:migrate -- --apply.
-- PostgreSQL 10-compatible SQL; actual host compatibility remains a staging gate.
CREATE SCHEMA IF NOT EXISTS tradeintra_poc;

CREATE TABLE IF NOT EXISTS tradeintra_poc.accounts (
  id uuid PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE IF NOT EXISTS tradeintra_poc.sites (
  account_id uuid NOT NULL REFERENCES tradeintra_poc.accounts(id),
  slug text NOT NULL CONSTRAINT poc_sites_slug_format CHECK (slug ~ '^(?!.*--)[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  draft jsonb NOT NULL,
  published_version integer NOT NULL CHECK (published_version > 0),
  PRIMARY KEY (account_id, slug)
);
CREATE TABLE IF NOT EXISTS tradeintra_poc.versions (
  account_id uuid NOT NULL,
  slug text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  config jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, slug, version),
  FOREIGN KEY (account_id, slug) REFERENCES tradeintra_poc.sites(account_id, slug)
);
-- Internal routing metadata only. Never returned by a public list endpoint.
CREATE TABLE IF NOT EXISTS tradeintra_poc.host_mappings (
  hostname text PRIMARY KEY,
  account_id uuid NOT NULL,
  slug text NOT NULL,
  FOREIGN KEY (account_id, slug) REFERENCES tradeintra_poc.sites(account_id, slug)
);
-- SQL session-query probe; NOT a working authentication system.
CREATE TABLE IF NOT EXISTS tradeintra_poc.sessions (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_poc.accounts(id),
  expires_at timestamptz NOT NULL
);
-- Contains only diagnostic jobs, never customer payloads.
CREATE TABLE IF NOT EXISTS tradeintra_poc.jobs (
  id bigserial PRIMARY KEY,
  type text NOT NULL CHECK (type = 'poc-tick'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE tradeintra_poc.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_poc.accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_poc.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_poc.sites FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_poc.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_poc.versions FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_poc.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_poc.sessions FORCE ROW LEVEL SECURITY;

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['accounts', 'sites', 'versions', 'sessions'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'tradeintra_poc'
      AND tablename = table_name AND policyname = 'account_isolation'
    ) THEN
      EXECUTE format(
        'CREATE POLICY account_isolation ON tradeintra_poc.%I USING (%I = NULLIF(current_setting(''tradeintra.account_id'', true), '''')::uuid) WITH CHECK (%I = NULLIF(current_setting(''tradeintra.account_id'', true), '''')::uuid)',
        table_name, CASE WHEN table_name = 'accounts' THEN 'id' ELSE 'account_id' END,
        CASE WHEN table_name = 'accounts' THEN 'id' ELSE 'account_id' END
      );
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION tradeintra_poc.reject_version_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Published configuration versions are immutable' USING ERRCODE = '23514';
END $$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'tradeintra_poc.versions'::regclass AND tgname = 'immutable_versions') THEN
    CREATE TRIGGER immutable_versions BEFORE UPDATE OR DELETE ON tradeintra_poc.versions
    FOR EACH ROW EXECUTE PROCEDURE tradeintra_poc.reject_version_mutation();
  END IF;
END $$;
