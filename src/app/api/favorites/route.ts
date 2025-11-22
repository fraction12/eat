import { createServerSupabase } from "@/utils/supabase-server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Get user's favorite recipes
export async function GET() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("favorite_recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ favorites: data || [] })
}

// Add a recipe to favorites
export async function POST(request: Request) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { recipe_title, recipe_link, recipe_image, recipe_source, recipe_description } =
      await request.json()

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorite_recipes")
      .select("id")
      .eq("user_id", user.id)
      .eq("recipe_link", recipe_link)
      .single()

    if (existing) {
      return NextResponse.json({ message: "Already favorited" }, { status: 200 })
    }

    const { data, error } = await supabase.from("favorite_recipes").insert({
      user_id: user.id,
      recipe_title,
      recipe_link,
      recipe_image,
      recipe_source,
      recipe_description,
    }).select().single()

    if (error) {
      console.error("Error adding favorite:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ favorite: data })
  } catch (error) {
    console.error("Error in POST /api/favorites:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

// Remove a recipe from favorites
export async function DELETE(request: Request) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const recipeLink = searchParams.get("recipe_link")

    if (!recipeLink) {
      return NextResponse.json({ error: "recipe_link is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("favorite_recipes")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_link", recipeLink)

    if (error) {
      console.error("Error removing favorite:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Removed from favorites" })
  } catch (error) {
    console.error("Error in DELETE /api/favorites:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
