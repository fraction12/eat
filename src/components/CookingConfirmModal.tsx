"use client"

import { useState, useEffect } from "react"
import { ChefHat, Loader2, Check, X, Plus, Minus, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type InventoryItem = {
  id: string
  item: string
  quantity: number
  unit?: string
}

type IngredientMatch = {
  recipeIngredient: string
  matchedInventoryId?: string
  matchedInventoryName?: string
  currentQuantity?: number
  suggestedDeduction?: number
  unit?: string
  confidence?: "high" | "medium" | "low" | "manual"
}

type Deduction = {
  inventoryItemId: string
  itemName: string
  quantityBefore: number
  quantityToDeduct: number
}

type Recipe = {
  title: string
  link: string
  source?: string
  image: string
  ingredients?: string[]
}

type CookingConfirmModalProps = {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe | null
  inventory: InventoryItem[]
  onConfirm: (deductions: Deduction[]) => Promise<void>
}

export function CookingConfirmModal({
  isOpen,
  onClose,
  recipe,
  inventory,
  onConfirm,
}: CookingConfirmModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [matches, setMatches] = useState<IngredientMatch[]>([])
  const [unmatched, setUnmatched] = useState<string[]>([])
  const [deductions, setDeductions] = useState<Map<string, number>>(new Map())
  const [isConfirming, setIsConfirming] = useState(false)
  const [mappingIngredient, setMappingIngredient] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && recipe && recipe.ingredients) {
      analyzeIngredients()
    }
  }, [isOpen, recipe])

  const analyzeIngredients = async () => {
    if (!recipe || !recipe.ingredients) return

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/cooking/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeTitle: recipe.title,
          recipeIngredients: recipe.ingredients,
          userInventory: inventory,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze ingredients")
      }

      const data = await response.json()
      setMatches(data.matches || [])
      setUnmatched(data.unmatched || [])

      // Initialize deductions with suggested amounts
      const initialDeductions = new Map<string, number>()
      data.matches.forEach((match: IngredientMatch) => {
        if (match.matchedInventoryId && match.suggestedDeduction) {
          initialDeductions.set(match.matchedInventoryId, match.suggestedDeduction)
        }
      })
      setDeductions(initialDeductions)
    } catch (error) {
      console.error("Failed to analyze ingredients:", error)
      setMatches([])
      setUnmatched(recipe.ingredients || [])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateDeduction = (inventoryId: string, amount: number, maxAmount: number) => {
    const newDeductions = new Map(deductions)
    const clampedAmount = Math.max(0, Math.min(maxAmount, amount))
    newDeductions.set(inventoryId, clampedAmount)
    setDeductions(newDeductions)
  }

  const handleManualMapping = (recipeIngredient: string, inventoryItemId: string) => {
    const inventoryItem = inventory.find((item) => item.id === inventoryItemId)
    if (!inventoryItem) return

    // Remove from unmatched
    setUnmatched((prev) => prev.filter((ing) => ing !== recipeIngredient))

    // Add to matches with manual confidence
    const newMatch: IngredientMatch = {
      recipeIngredient,
      matchedInventoryId: inventoryItem.id,
      matchedInventoryName: inventoryItem.item,
      currentQuantity: inventoryItem.quantity,
      suggestedDeduction: 1,
      unit: inventoryItem.unit,
      confidence: "manual",
    }

    setMatches((prev) => [...prev, newMatch])
    setDeductions((prev) => new Map(prev).set(inventoryItem.id, 1))
    setMappingIngredient(null)
  }

  const handleConfirm = async () => {
    if (!recipe) return

    setIsConfirming(true)

    try {
      // Build deductions array
      const deductionsArray: Deduction[] = []

      matches.forEach((match) => {
        if (match.matchedInventoryId && match.matchedInventoryName && match.currentQuantity !== undefined) {
          const amount = deductions.get(match.matchedInventoryId) || 0
          if (amount > 0) {
            deductionsArray.push({
              inventoryItemId: match.matchedInventoryId,
              itemName: match.matchedInventoryName,
              quantityBefore: match.currentQuantity,
              quantityToDeduct: amount,
            })
          }
        }
      })

      if (deductionsArray.length === 0) {
        // No deductions, just close
        onClose()
        return
      }

      await onConfirm(deductionsArray)
      onClose()
    } catch (error) {
      console.error("Failed to confirm cooking:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  if (!isOpen || !recipe) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Log Cooking</h2>
          </div>
          <p className="text-white/90 text-lg font-semibold">{recipe.title}</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-green-500 mb-4" />
              <p className="text-gray-600 text-lg">Analyzing ingredients with AI...</p>
              <p className="text-gray-400 text-sm mt-2">Matching to your inventory</p>
            </div>
          ) : (
            <>
              {/* Matched Ingredients */}
              {matches.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Ingredients to Deduct ({matches.length})
                  </h3>
                  <div className="space-y-3">
                    {matches.map((match, idx) => {
                      if (!match.matchedInventoryId || match.currentQuantity === undefined) return null

                      const currentDeduction = deductions.get(match.matchedInventoryId) || 0
                      const newQuantity = Math.max(0, match.currentQuantity - currentDeduction)

                      return (
                        <div
                          key={idx}
                          className={`border rounded-lg p-4 hover:border-green-300 transition-all ${
                            match.confidence === "manual" ? "border-blue-300 bg-blue-50/30" : "border-gray-200"
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Recipe Ingredient & Match Info */}
                            <div>
                              <p className="font-medium text-gray-900">{match.recipeIngredient}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-500">
                                  Matched: <span className="font-semibold">{match.matchedInventoryName}</span>
                                </p>
                                {match.confidence === "manual" && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    Manually Mapped
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-4">
                              {/* Current Quantity */}
                              <div className="flex-1 text-center">
                                <div className="text-xs text-gray-500 mb-1">Current</div>
                                <div className="font-bold text-lg text-gray-900">{match.currentQuantity}</div>
                                <div className="text-xs text-gray-400">{match.unit || "items"}</div>
                              </div>

                              {/* Arrow */}
                              <div className="text-gray-400">→</div>

                              {/* Deduction Control */}
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1 text-center">Deduct</div>
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      updateDeduction(
                                        match.matchedInventoryId!,
                                        currentDeduction - 1,
                                        match.currentQuantity!
                                      )
                                    }
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentDeduction <= 0}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={currentDeduction}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0
                                      updateDeduction(match.matchedInventoryId!, value, match.currentQuantity!)
                                    }}
                                    min="0"
                                    max={match.currentQuantity}
                                    className="w-20 text-center border border-gray-300 rounded-lg px-2 py-2 font-bold text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                  <button
                                    onClick={() =>
                                      updateDeduction(
                                        match.matchedInventoryId!,
                                        currentDeduction + 1,
                                        match.currentQuantity!
                                      )
                                    }
                                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={currentDeduction >= match.currentQuantity}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="text-xs text-gray-400 text-center mt-1">
                                  {match.unit || "items"}
                                </div>
                              </div>

                              {/* Arrow */}
                              <div className="text-gray-400">→</div>

                              {/* New Quantity */}
                              <div className="flex-1 text-center">
                                <div className="text-xs text-gray-500 mb-1">After</div>
                                <div
                                  className={`font-bold text-lg ${
                                    newQuantity === 0 ? "text-red-600" : "text-gray-900"
                                  }`}
                                >
                                  {newQuantity}
                                </div>
                                <div className="text-xs text-gray-400">{match.unit || "items"}</div>
                              </div>
                            </div>

                            {/* Warning for deletion */}
                            {newQuantity === 0 && (
                              <div className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded px-3 py-2">
                                ⚠️ This item will be removed from your inventory
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Unmatched Ingredients - Now with Manual Mapping */}
              {unmatched.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <X className="h-5 w-5 text-gray-400" />
                    Not in Your Inventory ({unmatched.length})
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Map these ingredients to your inventory if the AI missed them:
                  </p>
                  <div className="space-y-2">
                    {unmatched.map((ingredient, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          <span className="text-gray-700">{ingredient}</span>
                        </div>
                        {mappingIngredient === ingredient ? (
                          <div className="flex items-center gap-2">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleManualMapping(ingredient, e.target.value)
                                }
                              }}
                              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            >
                              <option value="">Select inventory item...</option>
                              {inventory
                                .filter(
                                  (item) =>
                                    !matches.some((m) => m.matchedInventoryId === item.id)
                                )
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.item} (Qty: {item.quantity} {item.unit || "items"})
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => setMappingIngredient(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setMappingIngredient(ingredient)}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                          >
                            <LinkIcon className="h-3 w-3" />
                            Map
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No matches at all */}
              {matches.length === 0 && !isAnalyzing && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No ingredients matched your inventory</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try manually mapping ingredients above, or log without deductions
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1" disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={isAnalyzing || isConfirming}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm & Update Inventory
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
