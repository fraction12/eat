"use client"

import { X, ChefHat, Heart, Bookmark, ExternalLink, Clock, Users, Tag, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

type InventoryItem = {
  id: string
  item: string
  price: number
  quantity: number
  created_at: string
}

type RecipeDetailModalProps = {
  isOpen: boolean
  onClose: () => void
  recipe: {
    title: string
    link: string
    description: string
    image: string
    pubDate?: string
    source?: string
    category?: string
    area?: string
    ingredients?: string[]
    instructions?: string
    tags?: string[]
    videoUrl?: string
  } | null
  onFavorite?: () => void
  onSaveToCollection?: () => void
  isFavorited?: boolean
  isInCollection?: boolean
  inventory?: InventoryItem[]
}

export function RecipeDetailModal({
  isOpen,
  onClose,
  recipe,
  onFavorite,
  onSaveToCollection,
  isFavorited = false,
  isInCollection = false,
  inventory = []
}: RecipeDetailModalProps) {
  if (!isOpen || !recipe) return null

  // Helper function to check if user has an ingredient
  const hasIngredient = (ingredient: string): boolean => {
    const ingredientLower = ingredient.toLowerCase()
    return inventory.some(item =>
      ingredientLower.includes(item.item.toLowerCase()) ||
      item.item.toLowerCase().includes(ingredientLower.split(' ')[0])
    )
  }

  // Count how many ingredients the user has
  const matchedIngredients = recipe.ingredients?.filter(ing => hasIngredient(ing)) || []
  const matchCount = matchedIngredients.length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Image */}
        <div className="relative h-40 bg-gray-200">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/svg%3E"
            }}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {/* Favorite Button */}
            {onFavorite && (
              <button
                onClick={onFavorite}
                className={`p-3 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 ${
                  isFavorited
                    ? "bg-white text-red-500 hover:scale-110"
                    : "bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 hover:scale-110"
                }`}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`h-5 w-5 transition-transform ${isFavorited ? "fill-current" : ""}`} />
              </button>
            )}
            {/* Bookmark Button */}
            {onSaveToCollection && (
              <button
                onClick={onSaveToCollection}
                className={`p-3 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  isInCollection
                    ? "bg-white text-blue-600 hover:scale-110"
                    : "bg-white/90 hover:bg-white text-gray-700 hover:text-blue-600 hover:scale-110"
                }`}
                title={isInCollection ? "Already in collection" : "Save to collection"}
              >
                <Bookmark className={`h-5 w-5 transition-transform ${isInCollection ? "fill-current" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title and Source */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h2>
          {recipe.source && (
            <p className="text-sm text-gray-600 mb-4">From {recipe.source}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <Tag className="h-3 w-3" />
                {recipe.category}
              </span>
            )}
            {recipe.area && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {recipe.area}
              </span>
            )}
            {recipe.tags && recipe.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          {recipe.description && (
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900">Ingredients</h3>
                {matchCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      You have {matchCount} of {recipe.ingredients.length}
                    </span>
                  </div>
                )}
              </div>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, idx) => {
                  const userHasIt = hasIngredient(ingredient)
                  return (
                    <li
                      key={idx}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                        userHasIt ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      {userHasIt ? (
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="text-gray-400 mt-0.5 ml-0.5 flex-shrink-0">○</span>
                      )}
                      <span className={`${userHasIt ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                        {ingredient}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {matchCount > 0 && matchCount < recipe.ingredients.length && (
                <p className="text-sm text-gray-600 mt-3 italic">
                  You need {recipe.ingredients.length - matchCount} more ingredient{recipe.ingredients.length - matchCount !== 1 ? 's' : ''} to make this recipe
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instructions</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {recipe.instructions}
              </div>
            </div>
          )}

          {/* Video Link */}
          {recipe.videoUrl && (
            <div className="mb-6">
              <a
                href={recipe.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Watch Video Tutorial
              </a>
            </div>
          )}

          {/* Cook Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href={recipe.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-lg font-semibold"
            >
              <ChefHat className="h-5 w-5" />
              View Full Recipe
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
