import { NextResponse } from "next/server"

// Cache recipes in memory to reduce API calls
let cachedRecipes: any[] = []
let cacheTimestamp = 0
const CACHE_DURATION = 1000 * 60 * 60 // 1 hour

// TheMealDB free API endpoints
const MEAL_DB_API = "https://www.themealdb.com/api/json/v1/1"

// Categories to fetch for diversity
const CATEGORIES = [
  "Seafood",
  "Chicken",
  "Beef",
  "Pasta",
  "Vegetarian",
  "Dessert",
  "Breakfast",
  "Side",
]

async function fetchRecipesByCategory(category: string) {
  try {
    const response = await fetch(
      `${MEAL_DB_API}/filter.php?c=${category}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    if (!response.ok) return []

    const data = await response.json()
    return data.meals || []
  } catch (error) {
    console.error(`Error fetching ${category} recipes:`, error)
    return []
  }
}

async function fetchRecipeDetails(mealId: string) {
  try {
    const response = await fetch(`${MEAL_DB_API}/lookup.php?i=${mealId}`)
    if (!response.ok) return null

    const data = await response.json()
    return data.meals?.[0] || null
  } catch (error) {
    console.error(`Error fetching recipe ${mealId}:`, error)
    return null
  }
}

function convertMealDBToRecipe(meal: any) {
  // Extract ingredients from the meal object
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure} ${ingredient}`.trim())
    }
  }

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    link: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
    description: meal.strInstructions?.substring(0, 200) + "..." || "",
    image: meal.strMealThumb,
    pubDate: new Date().toISOString(),
    source: "TheMealDB",
    category: meal.strCategory,
    area: meal.strArea,
    ingredients: ingredients,
    instructions: meal.strInstructions,
    tags: meal.strTags?.split(",") || [],
    videoUrl: meal.strYoutube,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get("refresh") === "true"

    // Check cache
    const now = Date.now()
    if (!forceRefresh && cachedRecipes.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        recipes: cachedRecipes,
        cached: true,
        count: cachedRecipes.length
      })
    }

    // Fetch recipes from multiple categories
    console.log("Fetching fresh recipes from TheMealDB...")
    const allMeals: any[] = []

    for (const category of CATEGORIES) {
      const meals = await fetchRecipesByCategory(category)
      // Take first 15 from each category
      allMeals.push(...meals.slice(0, 15))
    }

    // Fetch full details for a selection of recipes
    console.log(`Fetched ${allMeals.length} meal previews, getting details...`)
    const detailedRecipes = []

    // Get details for first 100 recipes to keep it reasonable
    const mealsToFetch = allMeals.slice(0, 100)

    for (const meal of mealsToFetch) {
      const details = await fetchRecipeDetails(meal.idMeal)
      if (details) {
        detailedRecipes.push(convertMealDBToRecipe(details))
      }
    }

    // Update cache
    cachedRecipes = detailedRecipes
    cacheTimestamp = now

    return NextResponse.json({
      recipes: detailedRecipes,
      cached: false,
      count: detailedRecipes.length
    })
  } catch (error) {
    console.error("Error in built-in recipes API:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipes" },
      { status: 500 }
    )
  }
}
