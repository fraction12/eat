# Cooking History Feature - Setup Guide

This guide will help you set up the new cooking history feature that automatically tracks when you cook recipes and deducts ingredients from your inventory.

## 🎯 What's New

The cooking history feature includes:
- **AI-Powered Ingredient Matching** - Claude Haiku analyzes recipes and matches ingredients to your inventory
- **Smart Deductions** - Automatically deducts the right quantities from your inventory
- **Cooking History** - Track all the recipes you've cooked with pagination
- **Undo Functionality** - Reverse a cooking entry within 24 hours
- **Editable Quantities** - Review and adjust ingredient deductions before confirming

## 📋 Setup Steps

### 1. Run Database Migration

You need to create the `cooking_history` table in your Supabase database.

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `/supabase/migrations/cooking_history_schema.sql`
5. Click **Run** to execute the migration

**Option B: Using Supabase CLI**
```bash
supabase db push
```

The migration will create:
- `cooking_history` table with RLS policies
- Indexes for optimized queries
- Automatic trigger to disable undo after 24 hours

### 2. Verify Environment Variables

Make sure you have the OpenAI API key set in your `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

If you don't have an OpenAI API key:
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Add it to your `.env.local` file

**Note:** The feature uses GPT-4o-mini for cost efficiency (~$0.0001-0.0003 per recipe analysis)

### 3. Restart Your Development Server

```bash
npm run dev
```

## 🚀 How to Use

### Cooking a Recipe

1. Browse recipes on the **Recipes** page
2. Click on a recipe to view details
3. Click the green **Chef Hat** button (🧑‍🍳) to log cooking
4. Review the AI-matched ingredients and suggested deductions
5. Adjust quantities if needed using the dropdowns
6. Click **Confirm & Update Inventory**
7. Your inventory will be automatically updated!

### Viewing Cooking History

1. Click the **Cooked** button in the main navigation
2. See all your previously cooked recipes
3. Each card shows:
   - Recipe image and title
   - When you cooked it (relative time)
   - Ingredients that were deducted
   - Undo button (if within 24 hours)

### Undoing a Cook

1. Open **Cooking History**
2. Find the recipe you want to undo (must be within 24 hours)
3. Click **Undo Cook**
4. Your inventory will be restored automatically!

## 🎨 Features in Detail

### AI Ingredient Matching

The system uses GPT-4o-mini to intelligently match recipe ingredients to your inventory:

**Example:**
- Recipe says: "2 cups chicken breast"
- Your inventory has: "chicken" with quantity 5
- AI suggests: Deduct 2 from chicken (you'll have 3 left)

The AI:
- Handles fuzzy matching (e.g., "chicken breast" → "chicken")
- Parses quantities from recipe text
- Falls back to quantity=1 if uncertain
- Shows confidence level (high/medium/low)

### Editable Deductions

Before confirming, you can:
- Change deduction amounts using dropdowns
- Set deductions to 0 to skip an ingredient
- See real-time preview of new inventory quantities
- Items reaching 0 are automatically removed

### Cooking History

- Paginated (10 recipes per page)
- Sorted by most recent first
- Shows what was deducted
- Indicates if undo is still available
- Beautiful card-based UI

### 24-Hour Undo Window

- Undo any cooking within 24 hours
- Restores exact quantities to inventory
- Recreates deleted items if needed
- Marked as "undone" in history (won't show again)

## 🔒 Security & Privacy

- All cooking history is private (RLS policies)
- Only you can see and undo your cooking entries
- AI processing happens server-side
- No recipe data is shared with third parties

## 💰 Cost Considerations

- AI calls use GPT-4o-mini (cost-efficient model)
- Estimated cost: ~$0.0001-0.0003 per recipe analysis
- Results are not cached (for freshness)
- Fallback to simple matching if AI fails

## 🐛 Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in
- Check Supabase authentication is working

### AI Matching Fails
- System automatically falls back to simple matching
- Deductions will default to quantity=1
- You can still adjust manually

### Ingredients Not Matching
- Check your inventory item names
- Use simple names (e.g., "chicken" not "Organic Free-Range Chicken Breast")
- AI is pretty good at fuzzy matching

### Can't Undo a Cook
- Undo is only available for 24 hours
- Check if the entry is marked as "Can Undo"
- If already undone, it won't appear in history

## 📝 Database Schema

The `cooking_history` table stores:
- `id` - Unique identifier
- `user_id` - Your user ID (RLS enforced)
- `recipe_title` - Name of the recipe
- `recipe_url` - Link to the recipe
- `recipe_source` - Where it came from
- `recipe_image` - Recipe photo
- `cooked_at` - When you cooked it
- `ingredients_deducted` - JSON array of what was used
- `can_undo` - Whether undo is available
- `undone_at` - When it was undone (if applicable)
- `notes` - Optional notes (future feature)

## 🎯 Future Enhancements

Potential improvements:
- Servings multiplier (cooking 2x the recipe)
- Notes field for custom comments
- Cooking statistics dashboard
- Shopping list from depleted ingredients
- Recipe recommendations based on cooking history
- Export cooking history to CSV

## 🙋‍♂️ Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Verify the database migration ran successfully
3. Ensure your OpenAI API key is valid
4. Check that you have inventory items created

Enjoy tracking your cooking! 🧑‍🍳✨
