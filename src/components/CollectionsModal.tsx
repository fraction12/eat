"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus, Folder, Trash2, Edit2, Check } from "lucide-react"
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

  // New collection form
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newIcon, setNewIcon] = useState("📁")
  const [newColor, setNewColor] = useState("#3B82F6")

  const iconOptions = ["📁", "🍳", "💚", "⭐", "🔥", "🍕", "🥗", "🍰", "🌮", "🍜"]
  const colorOptions = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

  useEffect(() => {
    if (isOpen) {
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

  const handleCollectionClick = (collection: Collection) => {
    if (mode === "select" && onCollectionSelect) {
      onCollectionSelect(collection)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "select" ? "Save to Collection" : "My Collections"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === "select"
                ? "Choose a collection to save this recipe"
                : "Organize your favorite recipes"}
            </p>
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
        </div>
      </div>
    </div>
  )
}
