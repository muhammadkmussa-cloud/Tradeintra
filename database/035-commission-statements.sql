-- Owner-submitted Deriv commission statements and Finance review fields.
ALTER TABLE tradeintra_studio.commission_entries
  DROP CONSTRAINT IF EXISTS commission_entries_status_check;
ALTER TABLE tradeintra_studio.commission_entries
  ADD CONSTRAINT commission_entries_status_check
  CHECK (status IN ('estimated', 'imported', 'settled', 'reversed', 'submitted', 'approved', 'rejected'));

ALTER TABLE tradeintra_studio.commission_entries
  ADD COLUMN IF NOT EXISTS statement_name text,
  ADD COLUMN IF NOT EXISTS statement_sha256 text,
  ADD COLUMN IF NOT EXISTS statement_csv text,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer_note text;

CREATE UNIQUE INDEX IF NOT EXISTS commission_entries_statement_hash
  ON tradeintra_studio.commission_entries(account_id, statement_sha256)
  WHERE statement_sha256 IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS commission_entries_active_period
  ON tradeintra_studio.commission_entries(account_id, period)
  WHERE status IN ('submitted', 'approved', 'settled');
