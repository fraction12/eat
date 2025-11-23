"use client"

import { useState, useEffect } from "react"
import { ChefHat, Loader2, Check, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  const updateDeduction = (inventoryId: string, amount: number) => {
    const newDeductions = new Map(deductions)
    newDeductions.set(inventoryId, amount)
    setDeductions(newDeductions)
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
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
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
                          className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{match.recipeIngredient}</p>
                              <p className="text-sm text-gray-500">
                                Matched: <span className="font-semibold">{match.matchedInventoryName}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Current Quantity */}
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Current:</span>{" "}
                                <span className="font-bold text-gray-900">{match.currentQuantity}</span>
                              </div>

                              {/* Arrow */}
                              <span className="text-gray-400">→</span>

                              {/* Deduction Dropdown */}
                              <div className="relative">
                                <select
                                  value={currentDeduction}
                                  onChange={(e) =>
                                    updateDeduction(match.matchedInventoryId!, parseInt(e.target.value))
                                  }
                                  className="appearance-none bg-white border-2 border-gray-300 rounded-lg px-3 py-2 pr-8 font-bold text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer hover:border-green-400 transition-all"
                                >
                                  {Array.from({ length: match.currentQuantity + 1 }, (_, i) => i).map((num) => (
                                    <option key={num} value={num}>
                                      Deduct {num}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              </div>

                              {/* Arrow */}
                              <span className="text-gray-400">→</span>

                              {/* New Quantity */}
                              <div className="text-sm min-w-[80px]">
                                <span className="font-medium text-gray-600">After:</span>{" "}
                                <span className={`font-bold ${newQuantity === 0 ? "text-red-600" : "text-gray-900"}`}>
                                  {newQuantity}
                                  {newQuantity === 0 && " (removed)"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Unmatched Ingredients */}
              {unmatched.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <X className="h-5 w-5 text-gray-400" />
                    Not in Your Inventory ({unmatched.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {unmatched.map((ingredient, idx) => (
                        <li key={idx} className="text-gray-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* No matches at all */}
              {matches.length === 0 && !isAnalyzing && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No ingredients matched your inventory</p>
                  <p className="text-gray-400 text-sm mt-2">You can still log this cook without deductions</p>
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
