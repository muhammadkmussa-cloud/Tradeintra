-- Identity, referral, credits, Deriv gate, and one-active-site rules. PostgreSQL 10 syntax.
ALTER TABLE tradeintra_studio.credentials
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'credentials_role_check'
      AND conrelid = 'tradeintra_studio.credentials'::regclass
  ) THEN
    ALTER TABLE tradeintra_studio.credentials
      ADD CONSTRAINT credentials_role_check
      CHECK (role IN ('user', 'support', 'finance', 'super_admin', 'service'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS credentials_referral_code
  ON tradeintra_studio.credentials(referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS tradeintra_studio.email_verifications (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.credentials(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_verifications_account
  ON tradeintra_studio.email_verifications(account_id);

CREATE TABLE IF NOT EXISTS tradeintra_studio.password_resets (
  token_hash text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.credentials(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.auth_identities (
  provider text NOT NULL CHECK (provider IN ('google')),
  provider_account_id text NOT NULL,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.credentials(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS auth_identities_account
  ON tradeintra_studio.auth_identities(account_id);

CREATE TABLE IF NOT EXISTS tradeintra_studio.referrals (
  id uuid PRIMARY KEY,
  referrer_id uuid NOT NULL REFERENCES tradeintra_studio.credentials(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL UNIQUE REFERENCES tradeintra_studio.credentials(id) ON DELETE CASCADE,
  code text NOT NULL,
  reward_credits integer NOT NULL DEFAULT 30 CHECK (reward_credits >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  rewarded_at timestamptz,
  CHECK (referrer_id <> referee_id)
);

CREATE TABLE IF NOT EXISTS tradeintra_studio.credit_ledger (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_ledger_account
  ON tradeintra_studio.credit_ledger(account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tradeintra_studio.deriv_links (
  account_id uuid PRIMARY KEY REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'mock' CHECK (mode IN ('mock', 'sandbox', 'live')),
  status text NOT NULL DEFAULT 'linked' CHECK (status IN ('linked', 'expired', 'revoked')),
  external_account_id text,
  encrypted_token text,
  linked_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

-- Enable only once existing duplicates are archived. Application enforcement is always on.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM tradeintra_studio.sites
    WHERE archived = false
    GROUP BY account_id
    HAVING count(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS sites_one_active
      ON tradeintra_studio.sites(account_id)
      WHERE archived = false;
  END IF;
END $$;
