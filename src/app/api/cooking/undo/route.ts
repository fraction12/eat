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
    const { cookingHistoryId } = body

    if (!cookingHistoryId) {
      return NextResponse.json({ error: "cookingHistoryId is required" }, { status: 400 })
    }

    // Get the cooking history entry
    const { data: cookingEntry, error: fetchError } = await supabase
      .from("cooking_history")
      .select("*")
      .eq("id", cookingHistoryId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !cookingEntry) {
      return NextResponse.json({ error: "Cooking history entry not found" }, { status: 404 })
    }

    // Check if undo is allowed
    const cookedAt = new Date(cookingEntry.cooked_at)
    const now = new Date()
    const hoursSinceCooked = (now.getTime() - cookedAt.getTime()) / (1000 * 60 * 60)

    if (!cookingEntry.can_undo || hoursSinceCooked >= 24) {
      return NextResponse.json(
        { error: "This cooking entry can no longer be undone (24-hour limit exceeded)" },
        { status: 400 }
      )
    }

    if (cookingEntry.undone_at) {
      return NextResponse.json({ error: "This cooking entry has already been undone" }, { status: 400 })
    }

    // Restore inventory
    const ingredientsDeducted = cookingEntry.ingredients_deducted as any[]

    for (const ingredient of ingredientsDeducted) {
      const { inventory_item_id, item_name, quantity_deducted, quantity_after } = ingredient

      // Check if item still exists in inventory
      const { data: existingItem } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", inventory_item_id)
        .eq("user_id", user.id)
        .single()

      if (existingItem) {
        // Item exists, restore the quantity
        const restoredQuantity = existingItem.quantity + quantity_deducted

        const { error: updateError } = await supabase
          .from("inventory")
          .update({ quantity: restoredQuantity })
          .eq("id", inventory_item_id)
          .eq("user_id", user.id)

        if (updateError) {
          console.error("Failed to restore inventory item:", updateError)
          return NextResponse.json(
            { error: `Failed to restore ${item_name} in inventory` },
            { status: 500 }
          )
        }
      } else {
        // Item was deleted (quantity reached 0), recreate it
        const { error: insertError } = await supabase.from("inventory").insert({
          id: inventory_item_id,
          user_id: user.id,
          item: item_name,
          quantity: quantity_deducted,
          price: 0, // Default price
        })

        if (insertError) {
          console.error("Failed to recreate inventory item:", insertError)
          // Continue with other items even if one fails
        }
      }
    }

    // Mark cooking history as undone
    const { error: updateError } = await supabase
      .from("cooking_history")
      .update({
        undone_at: now.toISOString(),
        can_undo: false,
      })
      .eq("id", cookingHistoryId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Failed to mark cooking as undone:", updateError)
      return NextResponse.json({ error: "Failed to undo cooking" }, { status: 500 })
    }

    // Get updated inventory
    const { data: updatedInventory } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      success: true,
      message: "Cooking undone successfully",
      updatedInventory: updatedInventory || [],
    })
  } catch (error) {
    console.error("Error undoing cooking:", error)
    return NextResponse.json({ error: "Failed to undo cooking" }, { status: 500 })
  }
}
