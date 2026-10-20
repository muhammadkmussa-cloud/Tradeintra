-- Marketplace delivery files live in private storage, not the database.
ALTER TABLE tradeintra_studio.marketplace_listings
  ADD COLUMN IF NOT EXISTS delivery_asset_key text,
  ADD COLUMN IF NOT EXISTS delivery_size integer,
  ADD COLUMN IF NOT EXISTS delivery_mime text;
