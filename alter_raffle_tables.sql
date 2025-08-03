-- Add category column to raffle_items table if it doesn't exist
ALTER TABLE raffle_items ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT NULL AFTER raffle_id;

-- Modify product_id column to allow NULL values
ALTER TABLE raffle_items MODIFY COLUMN product_id INT NULL DEFAULT NULL;