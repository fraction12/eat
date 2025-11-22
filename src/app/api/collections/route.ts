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

// GET - Fetch user's collections
export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch collections with recipe count
    const { data: collections, error } = await supabase
      .from("recipe_collections")
      .select(`
        *,
        collection_recipes(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching collections:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to include recipe count
    const formattedCollections = collections?.map(col => ({
      ...col,
      recipe_count: col.collection_recipes?.[0]?.count || 0,
      collection_recipes: undefined
    })) || []

    return NextResponse.json({ collections: formattedCollections })
  } catch (error: any) {
    console.error("Collections GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new collection
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, icon, color } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: collection, error } = await supabase
      .from("recipe_collections")
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        icon: icon || "📁",
        color: color || "#3B82F6"
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating collection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ collection })
  } catch (error: any) {
    console.error("Collections POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a collection
export async function DELETE(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("id")

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { error } = await supabase
      .from("recipe_collections")
      .delete()
      .eq("id", collectionId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting collection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Collections DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update a collection
export async function PATCH(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, description, icon, color } = body

    if (!id) {
      return NextResponse.json({ error: "Collection ID required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (icon !== undefined) updates.icon = icon
    if (color !== undefined) updates.color = color

    const { data: collection, error } = await supabase
      .from("recipe_collections")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating collection:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ collection })
  } catch (error: any) {
    console.error("Collections PATCH error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
