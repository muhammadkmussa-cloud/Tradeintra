ALTER TABLE tradeintra_studio.marketplace_orders
  ADD COLUMN IF NOT EXISTS downloaded_at timestamptz;
