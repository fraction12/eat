"use client"

import { useState, useEffect } from "react"
import { ChefHat, Loader2, Undo2, Clock, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/Toast"

type CookingHistoryEntry = {
  id: string
  recipeTitle: string
  recipeUrl: string
  recipeSource: string
  recipeImage: string
  cookedAt: string
  ingredientsDeducted: any[]
  canUndo: boolean
  notes?: string
}

type CookingHistoryModalProps = {
  isOpen: boolean
  onClose: () => void
  onInventoryUpdate: () => void
}

export function CookingHistoryModal({ isOpen, onClose, onInventoryUpdate }: CookingHistoryModalProps) {
  const [history, setHistory] = useState<CookingHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const limit = 10

  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen, currentPage])

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cooking/history?page=${currentPage}&limit=${limit}`)
      if (!response.ok) {
        throw new Error("Failed to fetch cooking history")
      }

      const data = await response.json()
      setHistory(data.history || [])
      setTotal(data.pagination.total || 0)
      setTotalPages(data.pagination.totalPages || 1)
    } catch (error) {
      console.error("Failed to fetch cooking history:", error)
      showToast("error", "Failed to load cooking history")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndo = async (entry: CookingHistoryEntry) => {
    if (!entry.canUndo) {
      showToast("error", "This cooking entry can no longer be undone (24-hour limit)")
      return
    }

    setUndoingId(entry.id)

    try {
      const response = await fetch("/api/cooking/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookingHistoryId: entry.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to undo cooking")
      }

      showToast("success", "Cooking undone! Inventory restored.")
      await fetchHistory() // Refresh history
      onInventoryUpdate() // Update inventory in parent
    } catch (error) {
      console.error("Failed to undo cooking:", error)
      showToast("error", "Failed to undo cooking. Please try again.")
    } finally {
      setUndoingId(null)
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Cooking History</h2>
                <p className="text-white/90 text-sm">
                  {total} recipe{total !== 1 ? "s" : ""} cooked
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-green-500 mb-4" />
              <p className="text-gray-600">Loading cooking history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No cooking history yet</p>
              <p className="text-gray-400 text-sm mt-2">Start cooking recipes to see them here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Recipe Image */}
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={entry.recipeImage || "/placeholder-recipe.jpg"}
                      alt={entry.recipeTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3C/svg%3E"
                      }}
                    />
                    {entry.canUndo && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Can Undo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recipe Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                      {entry.recipeTitle}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(entry.cookedAt)}
                      </span>
                      <span className="truncate ml-2">{entry.recipeSource}</span>
                    </div>

                    {/* Ingredients Deducted */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Ingredients Used:</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.ingredientsDeducted.slice(0, 3).map((ing: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                          >
                            {ing.item_name} -{ing.quantity_deducted}
                          </span>
                        ))}
                        {entry.ingredientsDeducted.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{entry.ingredientsDeducted.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {entry.canUndo && (
                      <Button
                        onClick={() => handleUndo(entry)}
                        variant="outline"
                        size="sm"
                        className="w-full text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400"
                        disabled={undoingId === entry.id}
                      >
                        {undoingId === entry.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            Undoing...
                          </>
                        ) : (
                          <>
                            <Undo2 className="h-3 w-3 mr-1" />
                            Undo Cook
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
