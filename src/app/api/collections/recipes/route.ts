import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getUser() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("sb-auth-token")

  if (!authCookie) {
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user } } = await supabase.auth.getUser(authCookie.value)
  return user
}

// GET - Fetch recipes in a collection
export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collection_id")

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verify user owns this collection
    const { data: collection } = await supabase
      .from("recipe_collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", user.id)
      .single()

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Fetch recipes in collection
    const { data: recipes, error } = await supabase
      .from("collection_recipes")
      .select("*")
      .eq("collection_id", collectionId)
      .order("added_at", { ascending: false })

    if (error) {
      console.error("Error fetching collection recipes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ recipes })
  } catch (error: any) {
    console.error("Collection recipes GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add recipe to collection
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { collection_id, recipe_url, recipe_title, recipe_image, recipe_source } = body

    if (!collection_id || !recipe_url || !recipe_title) {
      return NextResponse.json(
        { error: "Collection ID, recipe URL, and title are required" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verify user owns this collection
    const { data: collection } = await supabase
      .from("recipe_collections")
      .select("id")
      .eq("id", collection_id)
      .eq("user_id", user.id)
      .single()

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Check if recipe already in collection
    const { data: existing } = await supabase
      .from("collection_recipes")
      .select("id")
      .eq("collection_id", collection_id)
      .eq("recipe_url", recipe_url)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Recipe already in collection" },
        { status: 400 }
      )
    }

    // Add recipe to collection
    const { data: recipe, error } = await supabase
      .from("collection_recipes")
      .insert({
        collection_id,
        recipe_url,
        recipe_title,
        recipe_image: recipe_image || null,
        recipe_source: recipe_source || null
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding recipe to collection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ recipe })
  } catch (error: any) {
    console.error("Collection recipes POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remove recipe from collection
export async function DELETE(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("id")
    const collectionId = searchParams.get("collection_id")

    if (!recipeId || !collectionId) {
      return NextResponse.json(
        { error: "Recipe ID and Collection ID required" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verify user owns this collection
    const { data: collection } = await supabase
      .from("recipe_collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", user.id)
      .single()

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Remove recipe from collection
    const { error } = await supabase
      .from("collection_recipes")
      .delete()
      .eq("id", recipeId)
      .eq("collection_id", collectionId)

    if (error) {
      console.error("Error removing recipe from collection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Collection recipes DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
