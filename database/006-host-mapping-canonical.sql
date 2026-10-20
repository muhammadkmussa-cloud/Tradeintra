-- Canonical custom-host names. NOT VALID preserves legacy rows; new writes must comply.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'host_mappings_canonical_hostname'
      AND conrelid = 'tradeintra_studio.host_mappings'::regclass
  ) THEN
    ALTER TABLE tradeintra_studio.host_mappings
      ADD CONSTRAINT host_mappings_canonical_hostname
      CHECK (
        hostname = lower(hostname)
        AND char_length(hostname) <= 253
        AND hostname ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'
      ) NOT VALID;
  END IF;
END $$;
