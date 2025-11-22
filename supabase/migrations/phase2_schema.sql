-- Phase 2: Recipe Collections, Meal Planning, and Shopping Lists
-- Run this migration in your Supabase SQL Editor

-- 1. Recipes table (store user-saved and built-in recipes)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  source_name TEXT,
  category TEXT,
  area TEXT,
  ingredients JSONB, -- Array of ingredient strings
  instructions TEXT,
  prep_time INTEGER, -- minutes
  cook_time INTEGER, -- minutes
  servings INTEGER,
  difficulty TEXT, -- easy, medium, hard
  tags TEXT[], -- array of tags
  video_url TEXT,
  is_public BOOLEAN DEFAULT FALSE, -- for community sharing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- RLS Policies for recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Recipe Collections (like folders/playlists)
CREATE TABLE IF NOT EXISTS recipe_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  color TEXT, -- hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON recipe_collections(user_id);

-- RLS Policies for collections
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON recipe_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON recipe_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON recipe_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON recipe_collections FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Collection Recipes (many-to-many relationship)
CREATE TABLE IF NOT EXISTS collection_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES recipe_collections(id) ON DELETE CASCADE NOT NULL,
  recipe_url TEXT NOT NULL, -- Can be external URL or internal recipe ID
  recipe_title TEXT NOT NULL,
  recipe_image TEXT,
  recipe_source TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collection_recipes_collection ON collection_recipes(collection_id);

-- RLS Policies for collection_recipes
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipes in own collections"
  ON collection_recipes FOR SELECT
  USING (
    collection_id IN (
      SELECT id FROM recipe_collections WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add recipes to own collections"
  ON collection_recipes FOR INSERT
  WITH CHECK (
    collection_id IN (
      SELECT id FROM recipe_collections WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove recipes from own collections"
  ON collection_recipes FOR DELETE
  USING (
    collection_id IN (
      SELECT id FROM recipe_collections WHERE user_id = auth.uid()
    )
  );

-- 4. Meal Plan (weekly planning)
CREATE TABLE IF NOT EXISTS meal_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  recipe_url TEXT NOT NULL,
  recipe_title TEXT NOT NULL,
  recipe_image TEXT,
  recipe_source TEXT,
  servings INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_user_date ON meal_plan(user_id, date);

-- RLS Policies for meal_plan
ALTER TABLE meal_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans"
  ON meal_plan FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plan FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plan FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plan FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Shopping Lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);

-- RLS Policies for shopping_lists
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shopping lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Shopping List Items
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity DECIMAL,
  unit TEXT,
  category TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  from_recipe_url TEXT, -- Track which recipe this ingredient came from
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(list_id);

-- RLS Policies for shopping_list_items
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in own lists"
  ON shopping_list_items FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to own lists"
  ON shopping_list_items FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own lists"
  ON shopping_list_items FOR UPDATE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from own lists"
  ON shopping_list_items FOR DELETE
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON recipe_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
