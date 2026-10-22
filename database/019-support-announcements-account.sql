-- Support tickets, announcements, account deletion requests, and audit events.
CREATE TABLE IF NOT EXISTS tradeintra_studio.support_tickets (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('account','domain','site','billing','abuse')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','waiting','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.support_messages (
  id uuid PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES tradeintra_studio.support_tickets(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  author text NOT NULL CHECK (author IN ('customer','support')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.announcements (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  target text NOT NULL DEFAULT 'all',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.deletion_requests (
  account_id uuid PRIMARY KEY REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  execute_after timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cancelled','completed'))
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.audit_events (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES tradeintra_studio.accounts(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  detail text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['support_tickets','support_messages','announcements','deletion_requests','audit_events'] LOOP
    EXECUTE format('ALTER TABLE tradeintra_studio.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE tradeintra_studio.%I FORCE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename=t AND policyname='account_isolation') THEN
      EXECUTE format('CREATE POLICY account_isolation ON tradeintra_studio.%I USING(account_id = NULLIF(current_setting(''tradeintra.account_id'', true), '''')::uuid) WITH CHECK(account_id = NULLIF(current_setting(''tradeintra.account_id'', true), '''')::uuid)', t);
    END IF;
  END LOOP;
END $$;
