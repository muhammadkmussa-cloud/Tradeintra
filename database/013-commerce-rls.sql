-- Account-scoped RLS for commerce and payout tables. Admin/webhook paths use
-- transaction-local GUCs set only by trusted server code.
ALTER TABLE tradeintra_studio.domains ADD COLUMN IF NOT EXISTS site_id uuid;
ALTER TABLE tradeintra_studio.signal_deliveries ADD COLUMN IF NOT EXISTS account_id uuid;
UPDATE tradeintra_studio.signal_deliveries d
SET account_id = o.account_id
FROM tradeintra_studio.signal_orders o
WHERE d.signal_order_id = o.id AND d.account_id IS NULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'domains','domain_orders','commission_entries','seller_profiles',
    'marketplace_listings','marketplace_orders','signal_orders',
    'signal_deliveries','earnings_ledger','payouts','credit_purchases',
    'deriv_links'
  ] LOOP
    EXECUTE format('ALTER TABLE tradeintra_studio.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE tradeintra_studio.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='domains' AND policyname='domains_account') THEN
    CREATE POLICY domains_account ON tradeintra_studio.domains FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='domain_orders' AND policyname='domain_orders_account') THEN
    CREATE POLICY domain_orders_account ON tradeintra_studio.domain_orders FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='commission_entries' AND policyname='commission_entries_account_or_admin') THEN
    CREATE POLICY commission_entries_account_or_admin ON tradeintra_studio.commission_entries FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true')
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='seller_profiles' AND policyname='seller_profiles_account_or_admin') THEN
    CREATE POLICY seller_profiles_account_or_admin ON tradeintra_studio.seller_profiles FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true')
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='marketplace_listings' AND policyname='marketplace_listings_public_or_owner') THEN
    CREATE POLICY marketplace_listings_public_or_owner ON tradeintra_studio.marketplace_listings FOR SELECT
      USING (status IN ('live','sold') OR seller_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true');
    CREATE POLICY marketplace_listings_write ON tradeintra_studio.marketplace_listings FOR ALL
      USING (seller_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true')
      WITH CHECK (seller_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='marketplace_orders' AND policyname='marketplace_orders_account_or_admin') THEN
    CREATE POLICY marketplace_orders_account_or_admin ON tradeintra_studio.marketplace_orders FOR ALL
      USING (buyer_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR seller_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true')
      WITH CHECK (buyer_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='signal_orders' AND policyname='signal_orders_account') THEN
    CREATE POLICY signal_orders_account ON tradeintra_studio.signal_orders FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='signal_deliveries' AND policyname='signal_deliveries_account') THEN
    CREATE POLICY signal_deliveries_account ON tradeintra_studio.signal_deliveries FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='earnings_ledger' AND policyname='earnings_ledger_account') THEN
    CREATE POLICY earnings_ledger_account ON tradeintra_studio.earnings_ledger FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true')
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='payouts' AND policyname='payouts_account_or_admin') THEN
    CREATE POLICY payouts_account_or_admin ON tradeintra_studio.payouts FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true')
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.admin', true) = 'true');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='credit_purchases' AND policyname='credit_purchases_account_or_service') THEN
    CREATE POLICY credit_purchases_account_or_service ON tradeintra_studio.credit_purchases FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.service', true) = 'true')
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid OR current_setting('tradeintra.service', true) = 'true');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='tradeintra_studio' AND tablename='deriv_links' AND policyname='deriv_links_account') THEN
    CREATE POLICY deriv_links_account ON tradeintra_studio.deriv_links FOR ALL
      USING (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid)
      WITH CHECK (account_id = NULLIF(current_setting('tradeintra.account_id', true), '')::uuid);
  END IF;
END $$;
