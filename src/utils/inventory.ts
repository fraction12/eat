type Category = 'produce' | 'dairy' | 'meat' | 'bakery' | 'pantry' | 'frozen' | 'condiments'

type Item = {
  id: string
  item: string
  price: number
  quantity: number
  created_at: string
  category?: Category
  unit?: string
}

/**
 * Categorize items based on stored category or name
 */
export function categorizeItem(item: Item | string): Category {
  // If item object with stored category, use that
  if (typeof item === 'object' && item.category) {
    return item.category
  }

  // Otherwise, auto-categorize by name
  const name = typeof item === 'string' ? item.toLowerCase() : item.item.toLowerCase()

  // Check frozen first (more specific matches like "ice cream" before "cream")
  const frozen = ['frozen', 'ice cream', 'popsicle']
  if (frozen.some(keyword => name.includes(keyword))) return 'frozen'

  // Produce
  const produce = ['apple', 'banana', 'orange', 'tomato', 'lettuce', 'carrot', 'potato', 'onion', 'garlic', 'pepper', 'broccoli', 'spinach', 'cucumber', 'avocado', 'strawberry', 'grape', 'lemon', 'lime', 'berry', 'fruit', 'vegetable', 'salad', 'celery', 'mushroom', 'corn', 'peas']
  if (produce.some(keyword => name.includes(keyword))) return 'produce'

  // Dairy
  const dairy = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'cottage', 'cheddar', 'mozzarella', 'parmesan', 'sour cream', 'whipped cream']
  if (dairy.some(keyword => name.includes(keyword))) return 'dairy'

  // Meat & Seafood
  const meat = ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham', 'steak', 'fish', 'salmon', 'tuna', 'shrimp', 'meat', 'ground beef', 'lamb', 'duck']
  if (meat.some(keyword => name.includes(keyword))) return 'meat'

  // Bakery
  const bakery = ['bread', 'bagel', 'muffin', 'croissant', 'donut', 'bun', 'roll', 'tortilla', 'pita', 'baguette', 'cake', 'cookie', 'pastry', 'pizza']
  if (bakery.some(keyword => name.includes(keyword))) return 'bakery'

  // Condiments
  const condiments = ['sauce', 'ketchup', 'mustard', 'mayo', 'dressing', 'oil', 'vinegar', 'salt', 'pepper', 'spice', 'seasoning', 'syrup', 'jam', 'jelly', 'honey', 'salsa', 'hot sauce']
  if (condiments.some(keyword => name.includes(keyword))) return 'condiments'

  // Default to pantry
  return 'pantry'
}

/**
 * Calculate days since added
 */
export function getDaysOld(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - created.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
