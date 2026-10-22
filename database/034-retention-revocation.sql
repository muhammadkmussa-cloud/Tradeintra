CREATE TABLE IF NOT EXISTS tradeintra_studio.deletion_archives (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tradeintra_studio.provider_revocation_tasks (
  id uuid PRIMARY KEY,
  account_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('deriv','telegram')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','failed')),
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'deletion_archives','provider_revocation_tasks',
    'payouts','marketplace_orders','audit_events','domain_orders',
    'commission_entries','credit_purchases','deriv_links','telegram_connections'
  ] LOOP
    EXECUTE format('ALTER TABLE tradeintra_studio.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE tradeintra_studio.%I FORCE ROW LEVEL SECURITY', t);
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
