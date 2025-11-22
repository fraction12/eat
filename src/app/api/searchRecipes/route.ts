/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    // Use TheMealDB API (free, no API key needed)
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      throw new Error(`Recipe API error: ${response.status}`)
    }

    const data = await response.json()
    const meals = data.meals || []

    // Transform the response to our format
    const recipes = meals.map((meal: any) => {
      // Extract ingredients from the meal object
      const ingredients = []
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`]
        const measure = meal[`strMeasure${i}`]
        if (ingredient && ingredient.trim()) {
          ingredients.push(`${measure ? measure.trim() + " " : ""}${ingredient.trim()}`)
        }
      }

      // Split instructions into steps
      const instructions = meal.strInstructions
        ? meal.strInstructions
            .split(/\r?\n/)
            .filter((step: string) => step.trim())
            .map((step: string) => step.trim())
        : []

      return {
        id: meal.idMeal,
        title: meal.strMeal,
        description: `${meal.strCategory} - ${meal.strArea} cuisine`,
        category: meal.strCategory,
        area: meal.strArea,
        image: meal.strMealThumb,
        ingredients,
        instructions,
        videoUrl: meal.strYoutube,
        source: meal.strSource,
      }
    })

    return NextResponse.json({ recipes })
  } catch (err: any) {
    console.error("🚨 Search recipes error:", err)
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    )
  }
}
