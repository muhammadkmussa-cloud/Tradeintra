-- Align existing POC databases with the shared slug rule. PostgreSQL 10 syntax.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'poc_sites_slug_format'
      AND conrelid = 'tradeintra_poc.sites'::regclass
  ) THEN
    ALTER TABLE tradeintra_poc.sites
      ADD CONSTRAINT poc_sites_slug_format
      CHECK (slug ~ '^(?!.*--)[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$') NOT VALID;
  END IF;
END $$;
ALTER TABLE tradeintra_poc.sites
  DROP CONSTRAINT IF EXISTS sites_slug_check;
