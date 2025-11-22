"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Folder, Trash2, Edit2, Check, ArrowLeft, ExternalLink, ChefHat, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { showToast } from "@/components/Toast"

type Collection = {
  id: string
  name: string
  description: string | null
  icon: string
  color: string
  recipe_count?: number
  created_at: string
}

type CollectionRecipe = {
  id: string
  recipe_url: string
  recipe_title: string
  recipe_image: string | null
  recipe_source: string | null
  added_at: string
}

type CollectionsModalProps = {
  isOpen: boolean
  onClose: () => void
  onCollectionSelect?: (collection: Collection) => void
  mode?: "select" | "manage" // select for adding recipe, manage for viewing all
}

export function CollectionsModal({
  isOpen,
  onClose,
  onCollectionSelect,
  mode = "manage"
}: CollectionsModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Viewing collection recipes
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null)
  const [collectionRecipes, setCollectionRecipes] = useState<CollectionRecipe[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("")
  const [carouselIndex, setCarouselIndex] = useState(0)

  // New collection form
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newIcon, setNewIcon] = useState("📁")
  const [newColor, setNewColor] = useState("#3B82F6")

  const iconOptions = ["📁", "🍳", "💚", "⭐", "🔥", "🍕", "🥗", "🍰", "🌮", "🍜"]
  const colorOptions = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

  useEffect(() => {
    if (isOpen) {
      // Reset viewing state when modal opens
      setViewingCollection(null)
      setCollectionRecipes([])
      setRecipeSearchQuery("")
      setCarouselIndex(0)
      fetchCollections()
    }
  }, [isOpen])

  const fetchCollections = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/collections")
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error)
      showToast("error", "Failed to load collections")
    } finally {
      setIsLoading(false)
    }
  }

  const createCollection = async () => {
    if (!newName.trim()) {
      showToast("error", "Please enter a collection name")
      return
    }

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          icon: newIcon,
          color: newColor
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCollections([data.collection, ...collections])
        setNewName("")
        setNewDescription("")
        setNewIcon("📁")
        setNewColor("#3B82F6")
        setIsCreating(false)
        showToast("success", "Collection created!")
      } else {
        showToast("error", "Failed to create collection")
      }
    } catch (error) {
      console.error("Failed to create collection:", error)
      showToast("error", "Failed to create collection")
    }
  }

  const deleteCollection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection?")) return

    try {
      const response = await fetch(`/api/collections?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setCollections(collections.filter(c => c.id !== id))
        showToast("success", "Collection deleted")
      } else {
        showToast("error", "Failed to delete collection")
      }
    } catch (error) {
      console.error("Failed to delete collection:", error)
      showToast("error", "Failed to delete collection")
    }
  }

  const viewCollectionRecipes = async (collection: Collection) => {
    setViewingCollection(collection)
    setIsLoadingRecipes(true)

    try {
      const response = await fetch(`/api/collections/recipes?collection_id=${collection.id}`)
      if (response.ok) {
        const data = await response.json()
        setCollectionRecipes(data.recipes || [])
      } else {
        showToast("error", "Failed to load recipes")
      }
    } catch (error) {
      console.error("Failed to fetch collection recipes:", error)
      showToast("error", "Failed to load recipes")
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const removeRecipeFromCollection = async (recipeId: string) => {
    if (!viewingCollection) return

    try {
      const response = await fetch(
        `/api/collections/recipes?id=${recipeId}&collection_id=${viewingCollection.id}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        setCollectionRecipes(collectionRecipes.filter(r => r.id !== recipeId))
        showToast("success", "Recipe removed from collection")
      } else {
        showToast("error", "Failed to remove recipe")
      }
    } catch (error) {
      console.error("Failed to remove recipe:", error)
      showToast("error", "Failed to remove recipe")
    }
  }

  const handleCollectionClick = (collection: Collection) => {
    if (mode === "select" && onCollectionSelect) {
      onCollectionSelect(collection)
      onClose()
    } else if (mode === "manage") {
      viewCollectionRecipes(collection)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewingCollection && (
              <button
                onClick={() => setViewingCollection(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {viewingCollection
                  ? viewingCollection.name
                  : mode === "select"
                  ? "Save to Collection"
                  : "My Collections"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {viewingCollection
                  ? `${collectionRecipes.length} recipe${collectionRecipes.length !== 1 ? 's' : ''}`
                  : mode === "select"
                  ? "Choose a collection to save this recipe"
                  : "Organize your favorite recipes"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewingCollection ? (
            /* Show recipes in collection */
            isLoadingRecipes ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading recipes...</p>
              </div>
            ) : collectionRecipes.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No recipes in this collection yet</p>
                <p className="text-sm text-gray-400 mt-1">Use the bookmark button on recipes to add them here</p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search recipes..."
                      value={recipeSearchQuery}
                      onChange={(e) => {
                        setRecipeSearchQuery(e.target.value)
                        setCarouselIndex(0) // Reset to first recipe when searching
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {(() => {
                  // Filter recipes based on search
                  const filteredRecipes = collectionRecipes.filter(recipe =>
                    recipe.recipe_title.toLowerCase().includes(recipeSearchQuery.toLowerCase()) ||
                    recipe.recipe_source?.toLowerCase().includes(recipeSearchQuery.toLowerCase())
                  )

                  // Reset carousel index if it's out of bounds
                  if (carouselIndex >= filteredRecipes.length && filteredRecipes.length > 0) {
                    setCarouselIndex(0)
                  }

                  if (filteredRecipes.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No recipes found</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                      </div>
                    )
                  }

                  const currentRecipe = filteredRecipes[carouselIndex]

                  return (
                    <div className="space-y-4">
                      {/* Position Indicator */}
                      <div className="text-center text-sm text-gray-600 font-medium">
                        {carouselIndex + 1} of {filteredRecipes.length}
                      </div>

                      {/* Carousel */}
                      <div className="relative">
                        {/* Previous Button */}
                        {filteredRecipes.length > 1 && (
                          <button
                            onClick={() => setCarouselIndex((prev) => (prev - 1 + filteredRecipes.length) % filteredRecipes.length)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            disabled={filteredRecipes.length === 1}
                          >
                            <ChevronLeft className="h-6 w-6 text-gray-700" />
                          </button>
                        )}

                        {/* Recipe Card */}
                        <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg">
                          <div className="relative h-64">
                            <img
                              src={currentRecipe.recipe_image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3C/svg%3E"}
                              alt={currentRecipe.recipe_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-gray-900 text-lg mb-2">
                              {currentRecipe.recipe_title}
                            </h4>
                            {currentRecipe.recipe_source && (
                              <p className="text-sm text-gray-500 mb-4">{currentRecipe.recipe_source}</p>
                            )}
                            <div className="flex gap-2">
                              <a
                                href={currentRecipe.recipe_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold"
                              >
                                <ChefHat className="h-4 w-4" />
                                Cook This Recipe
                              </a>
                              <button
                                onClick={() => removeRecipeFromCollection(currentRecipe.id)}
                                className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from collection"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Next Button */}
                        {filteredRecipes.length > 1 && (
                          <button
                            onClick={() => setCarouselIndex((prev) => (prev + 1) % filteredRecipes.length)}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            disabled={filteredRecipes.length === 1}
                          >
                            <ChevronRight className="h-6 w-6 text-gray-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          ) : (
            /* Show collections list */
            <>
          {/* Create New Collection */}
          {!isCreating ? (
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full mb-4 gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Create New Collection
            </Button>
          ) : (
            <div className="mb-6 p-4 border-2 border-green-500 rounded-lg bg-green-50">
              <h3 className="font-semibold text-gray-900 mb-3">New Collection</h3>

              <Input
                type="text"
                placeholder="Collection name (e.g., Weeknight Dinners)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mb-3"
              />

              <Input
                type="text"
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mb-3"
              />

              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose an icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewIcon(icon)}
                      className={`w-10 h-10 text-2xl rounded-lg border-2 transition-all ${
                        newIcon === icon
                          ? "border-green-500 bg-green-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Choose a color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        newColor === color
                          ? "border-gray-900 scale-110"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createCollection} className="flex-1 gap-2">
                  <Check className="h-4 w-4" />
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false)
                    setNewName("")
                    setNewDescription("")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Collections List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading collections...</p>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No collections yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first collection to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  onClick={() => handleCollectionClick(collection)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    mode === "select"
                      ? "cursor-pointer hover:border-green-500 hover:bg-green-50"
                      : ""
                  }`}
                  style={{ borderColor: collection.color + "40", backgroundColor: collection.color + "10" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: collection.color + "30" }}
                      >
                        {collection.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{collection.name}</h4>
                        {collection.description && (
                          <p className="text-sm text-gray-600">{collection.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {collection.recipe_count || 0} recipe{collection.recipe_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {mode === "manage" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteCollection(collection.id)
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
