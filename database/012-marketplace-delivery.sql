-- Marketplace delivery metadata. Files remain outside the web root in production.
ALTER TABLE tradeintra_studio.marketplace_listings
  ADD COLUMN IF NOT EXISTS delivery_content text,
  ADD COLUMN IF NOT EXISTS delivery_filename text;
