-- Deriv OAuth state and short-lived trader sessions for the shared frontend.
CREATE TABLE IF NOT EXISTS tradeintra_studio.deriv_oauth_states (
  state_hash text PRIMARY KEY,
  site text NOT NULL,
  code_verifier text NOT NULL,
  return_path text NOT NULL DEFAULT '/trade',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.deriv_trader_sessions (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  site text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('mock','demo','real')),
  encrypted_token text,
  email text,
  account_id text,
  account_login text,
  account_currency text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS deriv_trader_sessions_expiry
  ON tradeintra_studio.deriv_trader_sessions(expires_at);
ALTER TABLE tradeintra_studio.deriv_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.deriv_oauth_states FORCE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.deriv_trader_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradeintra_studio.deriv_trader_sessions FORCE ROW LEVEL SECURITY;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['deriv_oauth_states','deriv_trader_sessions'] LOOP
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
