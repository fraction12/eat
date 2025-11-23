"use client"

import { useState, useEffect } from "react"
import { X, Save, Edit2, Folder, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { showToast } from "@/components/Toast"

type ScrapedRecipe = {
  title: string
  description?: string
  image?: string
  ingredients?: string[]
  instructions?: string
  prepTime?: number
  cookTime?: number
  totalTime?: number
  servings?: number
  category?: string
  cuisine?: string
  author?: string
  videoUrl?: string
  sourceUrl?: string
  sourceName?: string
}

type Collection = {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
}

type RecipePreviewModalProps = {
  isOpen: boolean
  onClose: () => void
  recipe: ScrapedRecipe | null
  onSave: (recipe: ScrapedRecipe, collectionId?: string) => Promise<void>
}

export function RecipePreviewModal({
  isOpen,
  onClose,
  recipe: initialRecipe,
  onSave
}: RecipePreviewModalProps) {
  const [recipe, setRecipe] = useState<ScrapedRecipe | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCollectionSelect, setShowCollectionSelect] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>()

  useEffect(() => {
    if (initialRecipe) {
      setRecipe({ ...initialRecipe })
    }
  }, [initialRecipe])

  useEffect(() => {
    if (isOpen && showCollectionSelect) {
      fetchCollections()
    }
  }, [isOpen, showCollectionSelect])

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections")
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error)
    }
  }

  const handleSave = async () => {
    if (!recipe) return

    setIsSaving(true)
    try {
      await onSave(recipe, selectedCollectionId)
      onClose()
    } catch (error) {
      console.error("Error saving recipe:", error)
      showToast("error", "Failed to save recipe. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const updateRecipe = (field: keyof ScrapedRecipe, value: any) => {
    if (!recipe) return
    setRecipe({ ...recipe, [field]: value })
  }

  if (!isOpen || !recipe) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Preview Recipe</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit before saving • From {recipe.sourceName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-colors ${
                isEditing ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
              }`}
              title={isEditing ? "View mode" : "Edit mode"}
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Image */}
          {recipe.image && (
            <div className="mb-6">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                }}
              />
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            {isEditing ? (
              <Input
                type="text"
                value={recipe.title}
                onChange={(e) => updateRecipe("title", e.target.value)}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
            )}
          </div>

          {/* Description */}
          {(recipe.description || isEditing) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              {isEditing ? (
                <textarea
                  value={recipe.description || ""}
                  onChange={(e) => updateRecipe("description", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              ) : (
                <p className="text-gray-700">{recipe.description}</p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(recipe.prepTime || isEditing) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prep Time (min)</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={recipe.prepTime || ""}
                    onChange={(e) => updateRecipe("prepTime", parseInt(e.target.value) || undefined)}
                  />
                ) : (
                  <p className="text-sm font-semibold">{recipe.prepTime} min</p>
                )}
              </div>
            )}
            {(recipe.cookTime || isEditing) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cook Time (min)</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={recipe.cookTime || ""}
                    onChange={(e) => updateRecipe("cookTime", parseInt(e.target.value) || undefined)}
                  />
                ) : (
                  <p className="text-sm font-semibold">{recipe.cookTime} min</p>
                )}
              </div>
            )}
            {(recipe.servings || isEditing) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Servings</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={recipe.servings || ""}
                    onChange={(e) => updateRecipe("servings", parseInt(e.target.value) || undefined)}
                  />
                ) : (
                  <p className="text-sm font-semibold">{recipe.servings}</p>
                )}
              </div>
            )}
            {(recipe.category || isEditing) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={recipe.category || ""}
                    onChange={(e) => updateRecipe("category", e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-semibold">{recipe.category}</p>
                )}
              </div>
            )}
          </div>

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Ingredients ({recipe.ingredients.length})
              </h3>
              {isEditing ? (
                <textarea
                  value={recipe.ingredients.join("\n")}
                  onChange={(e) =>
                    updateRecipe(
                      "ingredients",
                      e.target.value.split("\n").filter((i) => i.trim())
                    )
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                  rows={recipe.ingredients.length + 2}
                  placeholder="One ingredient per line"
                />
              ) : (
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instructions</h3>
              {isEditing ? (
                <textarea
                  value={recipe.instructions}
                  onChange={(e) => updateRecipe("instructions", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={10}
                />
              ) : (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {recipe.instructions}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {showCollectionSelect ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Save to Collection (Optional)
                </label>
                <select
                  value={selectedCollectionId || ""}
                  onChange={(e) => setSelectedCollectionId(e.target.value || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Don't add to collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.icon} {collection.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Recipe
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCollectionSelect(false)}
                  disabled={isSaving}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCollectionSelect(true)}
                className="flex-1 gap-2 bg-orange-500 hover:bg-orange-600"
              >
                <Save className="h-4 w-4" />
                Save Recipe
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
