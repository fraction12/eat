import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipe, collectionId } = body

    if (!recipe || !recipe.title) {
      return NextResponse.json({ error: "Recipe title is required" }, { status: 400 })
    }

    // Insert recipe into database
    const { data: savedRecipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        title: recipe.title,
        description: recipe.description || null,
        image_url: recipe.image || null,
        source_url: recipe.sourceUrl || null,
        source_name: recipe.sourceName || null,
        category: recipe.category || null,
        area: recipe.cuisine || null,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || null,
        prep_time: recipe.prepTime || null,
        cook_time: recipe.cookTime || null,
        servings: recipe.servings || null,
        video_url: recipe.videoUrl || null,
        tags: recipe.tags || [],
      })
      .select()
      .single()

    if (recipeError) {
      console.error("Recipe save error:", recipeError)
      return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 })
    }

    // If collectionId is provided, add recipe to collection
    if (collectionId && savedRecipe) {
      const { error: collectionError } = await supabase.from("collection_recipes").insert({
        collection_id: collectionId,
        recipe_url: savedRecipe.id, // Store recipe ID as URL for internal recipes
        recipe_title: savedRecipe.title,
        recipe_image: savedRecipe.image_url,
        recipe_source: savedRecipe.source_name,
      })

      if (collectionError) {
        console.error("Collection add error:", collectionError)
        // Don't fail the request, recipe is still saved
      }
    }

    return NextResponse.json({
      success: true,
      recipe: savedRecipe,
    })
  } catch (error) {
    console.error("Error saving recipe:", error)
    return NextResponse.json({ error: "Failed to save recipe" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's recipes
    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (recipesError) {
      console.error("Recipes fetch error:", recipesError)
      return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
    })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipeId, recipe } = body

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 })
    }

    if (!recipe || !recipe.title) {
      return NextResponse.json({ error: "Recipe title is required" }, { status: 400 })
    }

    // Update recipe in database
    const { data: updatedRecipe, error: recipeError } = await supabase
      .from("recipes")
      .update({
        title: recipe.title,
        description: recipe.description || null,
        image_url: recipe.image || null,
        source_url: recipe.sourceUrl || null,
        source_name: recipe.sourceName || null,
        category: recipe.category || null,
        area: recipe.cuisine || null,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || null,
        prep_time: recipe.prepTime || null,
        cook_time: recipe.cookTime || null,
        servings: recipe.servings || null,
        video_url: recipe.videoUrl || null,
        tags: recipe.tags || [],
      })
      .eq("id", recipeId)
      .eq("user_id", user.id) // Ensure user owns this recipe
      .select()
      .single()

    if (recipeError) {
      console.error("Recipe update error:", recipeError)
      return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      recipe: updatedRecipe,
    })
  } catch (error) {
    console.error("Error updating recipe:", error)
    return NextResponse.json({ error: "Failed to update recipe" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("id")

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 })
    }

    // Delete recipe from database
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId)
      .eq("user_id", user.id) // Ensure user owns this recipe

    if (deleteError) {
      console.error("Recipe delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 })
  }
}
