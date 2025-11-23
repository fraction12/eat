import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Anthropic from "@anthropic-ai/sdk"

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

type InventoryItem = {
  id: string
  item: string
  quantity: number
}

type IngredientMatch = {
  recipeIngredient: string
  matchedInventoryId?: string
  matchedInventoryName?: string
  currentQuantity?: number
  suggestedDeduction?: number
  unit?: string
  confidence?: "high" | "medium" | "low"
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
    const { recipeTitle, recipeIngredients, userInventory } = body as {
      recipeTitle: string
      recipeIngredients: string[]
      userInventory: InventoryItem[]
    }

    if (!recipeTitle || !recipeIngredients || !userInventory) {
      return NextResponse.json(
        { error: "Missing required fields: recipeTitle, recipeIngredients, userInventory" },
        { status: 400 }
      )
    }

    // Try AI matching first
    let matches: IngredientMatch[] = []
    let unmatched: string[] = []
    let usedAI = false

    try {
      const aiResult = await matchIngredientsWithAI(recipeTitle, recipeIngredients, userInventory)
      matches = aiResult.matches
      unmatched = aiResult.unmatched
      usedAI = true
    } catch (aiError) {
      console.error("AI matching failed, falling back to simple matching:", aiError)
      // Fall back to simple matching
      const fallbackResult = simpleFallbackMatching(recipeIngredients, userInventory)
      matches = fallbackResult.matches
      unmatched = fallbackResult.unmatched
      usedAI = false
    }

    return NextResponse.json({
      success: true,
      matches,
      unmatched,
      usedAI,
    })
  } catch (error) {
    console.error("Error preparing cooking:", error)
    return NextResponse.json({ error: "Failed to prepare cooking" }, { status: 500 })
  }
}

async function matchIngredientsWithAI(
  recipeTitle: string,
  recipeIngredients: string[],
  userInventory: InventoryItem[]
): Promise<{ matches: IngredientMatch[]; unmatched: string[] }> {
  const prompt = `You are helping match recipe ingredients to a user's inventory items and suggesting deduction amounts.

Recipe: ${recipeTitle}
Recipe Ingredients:
${recipeIngredients.map((ing, idx) => `${idx + 1}. ${ing}`).join("\n")}

User's Inventory:
${userInventory.map((item) => `- ${item.item} (ID: ${item.id}, Quantity: ${item.quantity})`).join("\n")}

For each recipe ingredient, determine:
1. Which inventory item it matches (if any) - use fuzzy matching for similar items
2. How much quantity to deduct from inventory (parse the recipe ingredient amount)
3. If no clear quantity is specified, default to 1

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "matches": [
    {
      "recipeIngredient": "2 cups chicken breast",
      "matchedInventoryId": "uuid-here",
      "matchedInventoryName": "chicken",
      "currentQuantity": 5,
      "suggestedDeduction": 2,
      "unit": "cups",
      "confidence": "high"
    }
  ],
  "unmatched": ["garam masala", "cream"]
}

Rules:
- Only match if you're reasonably confident (e.g., "chicken breast" matches "chicken")
- If uncertain about quantity, use 1
- confidence can be "high", "medium", or "low"
- unmatched array should contain recipe ingredients that don't match any inventory items
- Be conservative - round down if uncertain about quantities`

  const message = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const responseText = message.content[0].type === "text" ? message.content[0].text : ""

  // Parse the JSON response
  const result = JSON.parse(responseText)

  // Ensure all matched items have the required fields
  const matches: IngredientMatch[] = result.matches.map((match: any) => ({
    recipeIngredient: match.recipeIngredient,
    matchedInventoryId: match.matchedInventoryId,
    matchedInventoryName: match.matchedInventoryName,
    currentQuantity: match.currentQuantity,
    suggestedDeduction: match.suggestedDeduction || 1,
    unit: match.unit,
    confidence: match.confidence || "medium",
  }))

  const unmatched: string[] = result.unmatched || []

  return { matches, unmatched }
}

function simpleFallbackMatching(
  recipeIngredients: string[],
  userInventory: InventoryItem[]
): { matches: IngredientMatch[]; unmatched: string[] } {
  const matches: IngredientMatch[] = []
  const unmatched: string[] = []

  recipeIngredients.forEach((recipeIng) => {
    const lowerRecipeIng = recipeIng.toLowerCase()

    // Try to find a matching inventory item using simple substring matching
    const matchedItem = userInventory.find((invItem) => {
      const lowerInvItem = invItem.item.toLowerCase()
      return lowerRecipeIng.includes(lowerInvItem) || lowerInvItem.includes(lowerRecipeIng)
    })

    if (matchedItem) {
      matches.push({
        recipeIngredient: recipeIng,
        matchedInventoryId: matchedItem.id,
        matchedInventoryName: matchedItem.item,
        currentQuantity: matchedItem.quantity,
        suggestedDeduction: 1, // Default to 1 in fallback mode
        confidence: "low",
      })
    } else {
      unmatched.push(recipeIng)
    }
  })

  return { matches, unmatched }
}
