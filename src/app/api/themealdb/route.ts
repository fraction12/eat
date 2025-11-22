/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const ingredient = searchParams.get("ingredient")

    let recipes: any[] = []

    // If searching by ingredient, use filter endpoint
    if (ingredient) {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
      )

      if (response.ok) {
        const data = await response.json()
        if (data.meals) {
          // Get full details for each meal
          recipes = await Promise.all(
            data.meals.slice(0, 50).map(async (meal: any) => {
              const detailsRes = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
              )
              const detailsData = await detailsRes.json()
              return detailsData.meals ? detailsData.meals[0] : null
            })
          )
          recipes = recipes.filter(Boolean)
        }
      }
    }
    // Search by name
    else if (query) {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
      )

      if (response.ok) {
        const data = await response.json()
        recipes = data.meals || []
      }
    }
    // Get random meals if no query
    else {
      // Fetch 50 random meals
      const randomRecipes = await Promise.all(
        Array.from({ length: 50 }).map(async () => {
          const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php")
          const data = await response.json()
          return data.meals ? data.meals[0] : null
        })
      )
      recipes = randomRecipes.filter(Boolean)
    }

    // Normalize TheMealDB format to match our RSS format
    const normalizedRecipes = recipes.map((meal: any) => ({
      title: meal.strMeal,
      link: meal.strSource || `https://www.themealdb.com/meal/${meal.idMeal}`,
      description: meal.strInstructions?.substring(0, 200) + "..." || "",
      image: meal.strMealThumb || "",
      pubDate: new Date().toISOString(),
      source: "TheMealDB",
      category: meal.strCategory || "",
      area: meal.strArea || "",
    }))

    return NextResponse.json({ recipes: normalizedRecipes })
  } catch (err: any) {
    console.error("🚨 TheMealDB API error:", err)
    return NextResponse.json(
      { recipes: [], error: err.message || String(err) },
      { status: 200 }
    )
  }
}
