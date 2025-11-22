-- Migration: Change inventory.quantity from INTEGER to NUMERIC
-- Date: 2025-11-22
-- Purpose: Allow decimal quantities (0.5 cups, 1.25 lbs, etc.)

-- Change quantity column from INTEGER to NUMERIC(10,2)
-- This allows values like 1.50, 0.25, 100.00 etc.
ALTER TABLE inventory
ALTER COLUMN quantity TYPE NUMERIC(10, 2);

-- Update any NULL quantities to 1
UPDATE inventory
SET quantity = 1
WHERE quantity IS NULL;

-- Add constraint to ensure positive quantities
ALTER TABLE inventory
ADD CONSTRAINT quantity_positive CHECK (quantity > 0);

-- Add comment for documentation
COMMENT ON COLUMN inventory.quantity IS 'Item quantity (supports decimals up to 2 places, e.g., 1.50)';
