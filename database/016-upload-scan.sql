-- Malware-scan metadata for marketplace uploads.
ALTER TABLE tradeintra_studio.marketplace_uploads
  ADD COLUMN IF NOT EXISTS scan_status text NOT NULL DEFAULT 'basic-clean'
    CHECK (scan_status IN ('basic-clean', 'clamav-clean', 'unscanned')),
  ADD COLUMN IF NOT EXISTS scan_engine text NOT NULL DEFAULT 'basic';
