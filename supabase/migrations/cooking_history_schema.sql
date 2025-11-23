-- Cooking History Feature
-- Track when users cook recipes and automatically deduct ingredients from inventory

-- 1. Cooking History Table
CREATE TABLE IF NOT EXISTS cooking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_title TEXT NOT NULL,
  recipe_url TEXT NOT NULL,
  recipe_source TEXT,
  recipe_image TEXT,
  cooked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ingredients_deducted JSONB NOT NULL,
  -- Format: [{inventory_item_id: "uuid", item_name: "chicken", quantity_before: 5, quantity_deducted: 2, quantity_after: 3}]
  can_undo BOOLEAN DEFAULT true,
  undone_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Index for faster queries (user's cooking history, sorted by date)
CREATE INDEX IF NOT EXISTS idx_cooking_history_user_date ON cooking_history(user_id, cooked_at DESC);

-- RLS Policies for cooking_history
ALTER TABLE cooking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cooking history"
  ON cooking_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cooking history"
  ON cooking_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cooking history"
  ON cooking_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cooking history"
  ON cooking_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically disable undo after 24 hours
CREATE OR REPLACE FUNCTION disable_undo_after_24h()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cooked_at < NOW() - INTERVAL '24 hours' THEN
    NEW.can_undo = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to check undo eligibility on insert and update
CREATE TRIGGER check_undo_eligibility
  BEFORE INSERT OR UPDATE ON cooking_history
  FOR EACH ROW
  EXECUTE FUNCTION disable_undo_after_24h();
