-- Tighten subdomain syntax for existing installations. PostgreSQL 10 syntax.
-- NOT VALID keeps legacy rows readable while enforcing the rule on new writes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subdomains_slug_format'
      AND conrelid = 'tradeintra_studio.subdomains'::regclass
  ) THEN
    ALTER TABLE tradeintra_studio.subdomains
      ADD CONSTRAINT subdomains_slug_format
      CHECK (slug ~ '^(?!.*--)[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$') NOT VALID;
  END IF;
END $$;
ALTER TABLE tradeintra_studio.subdomains
  DROP CONSTRAINT IF EXISTS subdomains_slug_check;
