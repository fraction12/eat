import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

type Deduction = {
  inventoryItemId: string
  itemName: string
  quantityBefore: number
  quantityToDeduct: number
}

type Recipe = {
  title: string
  url: string
  source: string
  image: string
}

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
    const { recipe, deductions } = body as {
      recipe: Recipe
      deductions: Deduction[]
    }

    if (!recipe || !recipe.title || !recipe.url) {
      return NextResponse.json({ error: "Recipe information is required" }, { status: 400 })
    }

    if (!deductions || !Array.isArray(deductions) || deductions.length === 0) {
      return NextResponse.json({ error: "At least one deduction is required" }, { status: 400 })
    }

    // Process deductions and update inventory
    const ingredientsDeducted: any[] = []
    const itemsToDelete: string[] = []

    for (const deduction of deductions) {
      const { inventoryItemId, itemName, quantityBefore, quantityToDeduct } = deduction

      if (quantityToDeduct <= 0) {
        continue // Skip if no deduction
      }

      const newQuantity = Math.max(0, quantityBefore - quantityToDeduct)

      if (newQuantity === 0) {
        // Mark for deletion
        itemsToDelete.push(inventoryItemId)
      } else {
        // Update quantity
        const { error: updateError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", inventoryItemId)
          .eq("user_id", user.id)

        if (updateError) {
          console.error("Failed to update inventory item:", updateError)
          return NextResponse.json(
            { error: `Failed to update ${itemName} in inventory` },
            { status: 500 }
          )
        }
      }

      // Track deduction
      ingredientsDeducted.push({
        inventory_item_id: inventoryItemId,
        item_name: itemName,
        quantity_before: quantityBefore,
        quantity_deducted: quantityToDeduct,
        quantity_after: newQuantity,
      })
    }

    // Delete items that reached 0
    if (itemsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("inventory")
        .delete()
        .in("id", itemsToDelete)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Failed to delete depleted inventory items:", deleteError)
        // Don't fail the request, just log it
      }
    }

    // Save to cooking_history
    const { data: cookingHistory, error: historyError } = await supabase
      .from("cooking_history")
      .insert({
        user_id: user.id,
        recipe_title: recipe.title,
        recipe_url: recipe.url,
        recipe_source: recipe.source || "Unknown",
        recipe_image: recipe.image || null,
        ingredients_deducted: ingredientsDeducted,
        can_undo: true,
      })
      .select()
      .single()

    if (historyError) {
      console.error("Failed to save cooking history:", historyError)
      return NextResponse.json({ error: "Failed to save cooking history" }, { status: 500 })
    }

    // Get updated inventory
    const { data: updatedInventory } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      success: true,
      cookingHistoryId: cookingHistory.id,
      updatedInventory: updatedInventory || [],
      itemsDeleted: itemsToDelete.length,
    })
  } catch (error) {
    console.error("Error logging cooking:", error)
    return NextResponse.json({ error: "Failed to log cooking" }, { status: 500 })
  }
}
