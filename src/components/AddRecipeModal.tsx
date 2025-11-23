"use client"

import { useState } from "react"
import { X, Link as LinkIcon, Loader2 } from "lucide-react"
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

type AddRecipeModalProps = {
  isOpen: boolean
  onClose: () => void
  onRecipeScraped: (recipe: ScrapedRecipe) => void
}

export function AddRecipeModal({ isOpen, onClose, onRecipeScraped }: AddRecipeModalProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      showToast("error", "Please enter a recipe URL")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/recipes/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape recipe")
      }

      if (data.success && data.recipe) {
        showToast("success", "Recipe scraped successfully!")
        onRecipeScraped(data.recipe)
        setUrl("")
        onClose()
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Error scraping recipe:", error)
      showToast("error", error instanceof Error ? error.message : "Failed to scrape recipe. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Recipe from URL</h2>
            <p className="text-sm text-gray-600 mt-1">
              Paste a recipe URL to automatically extract the details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipe-url" className="block text-sm font-medium text-gray-700 mb-2">
              Recipe URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="recipe-url"
                type="url"
                placeholder="https://www.example.com/recipe"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          {/* Supported Sites Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Works with most recipe sites:</strong> AllRecipes, Food Network, NYT Cooking,
              Bon Appétit, Serious Eats, and thousands more that use standard recipe formats.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping Recipe...
                </>
              ) : (
                "Scrape Recipe"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
