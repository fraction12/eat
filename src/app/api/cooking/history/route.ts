import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
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

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Get total count
    const { count, error: countError } = await supabase
      .from("cooking_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("undone_at", null) // Only show non-undone entries

    if (countError) {
      console.error("Failed to count cooking history:", countError)
      return NextResponse.json({ error: "Failed to fetch cooking history" }, { status: 500 })
    }

    // Get paginated history
    const { data: history, error: historyError } = await supabase
      .from("cooking_history")
      .select("*")
      .eq("user_id", user.id)
      .is("undone_at", null) // Only show non-undone entries
      .order("cooked_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (historyError) {
      console.error("Failed to fetch cooking history:", historyError)
      return NextResponse.json({ error: "Failed to fetch cooking history" }, { status: 500 })
    }

    // Check which entries can still be undone (within 24 hours)
    const now = new Date()
    const historyWithUndoStatus = (history || []).map((entry: any) => {
      const cookedAt = new Date(entry.cooked_at)
      const hoursSinceCooked = (now.getTime() - cookedAt.getTime()) / (1000 * 60 * 60)
      const canUndo = entry.can_undo && hoursSinceCooked < 24

      return {
        id: entry.id,
        recipeTitle: entry.recipe_title,
        recipeUrl: entry.recipe_url,
        recipeSource: entry.recipe_source,
        recipeImage: entry.recipe_image,
        cookedAt: entry.cooked_at,
        ingredientsDeducted: entry.ingredients_deducted,
        canUndo,
        notes: entry.notes,
      }
    })

    return NextResponse.json({
      success: true,
      history: historyWithUndoStatus,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching cooking history:", error)
    return NextResponse.json({ error: "Failed to fetch cooking history" }, { status: 500 })
  }
}
