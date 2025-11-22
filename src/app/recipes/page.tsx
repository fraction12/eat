"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ChefHat, ExternalLink, Play } from "lucide-react"
import { RecipeCarousel } from "@/components/RecipeCarousel"

type AIRecipe = {
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  missingIngredients?: string[]
}

type SearchRecipe = {
  id: string
  title: string
  description: string
  category: string
  area: string
  image: string
  ingredients: string[]
  instructions: string[]
  videoUrl?: string
  source?: string
}

export default function RecipesPage() {
  const [aiRecipes, setAiRecipes] = useState<AIRecipe[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchRecipe[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Fetch AI-suggested recipes based on inventory
  useEffect(() => {
    async function fetchAIRecipes() {
      setIsLoadingAI(true)
      try {
        const response = await fetch("/api/recipes")
        if (response.ok) {
          const data = await response.json()
          setAiRecipes(data.recipes || [])
        }
      } catch (error) {
        console.error("Failed to fetch AI recipes:", error)
      } finally {
        setIsLoadingAI(false)
      }
    }
    fetchAIRecipes()
  }, [])

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/searchRecipes?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.recipes || [])
      } else {
        console.error("Search failed")
        alert("Failed to search recipes. Please try again.")
      }
    } catch (error) {
      console.error("Search error:", error)
      alert("Failed to search recipes. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Recipe Ideas</h1>
          <p className="text-gray-600">Discover what you can cook with your ingredients</p>
        </div>

        {/* AI-Suggested Recipes Carousel */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AI-Suggested For You</h2>
          {isLoadingAI ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Analyzing your inventory...</p>
            </div>
          ) : (
            <RecipeCarousel recipes={aiRecipes.slice(0, 5)} />
          )}
        </div>

        {/* Recipe Search */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Recipes from the Web</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for recipes (e.g., pasta, chicken curry, chocolate cake)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-lg py-6"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              size="lg"
              className="px-8"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  {/* Recipe Image */}
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                      {recipe.category}
                    </div>
                  </div>

                  {/* Recipe Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{recipe.description}</p>

                    {/* Ingredients Preview */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 text-sm mb-2">Ingredients:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-600 mr-2">•</span>
                            <span>{ing}</span>
                          </li>
                        ))}
                        {recipe.ingredients.length > 3 && (
                          <li className="text-gray-400 italic text-xs">
                            +{recipe.ingredients.length - 3} more ingredients
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {recipe.videoUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(recipe.videoUrl, "_blank")}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Video
                        </Button>
                      )}
                      {recipe.source && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(recipe.source, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Source
                        </Button>
                      )}
                      {!recipe.videoUrl && !recipe.source && (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          <ChefHat className="h-4 w-4 mr-1" />
                          Recipe
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && searchQuery && searchResults.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No recipes found for "{searchQuery}"</p>
            <p className="text-gray-400 text-sm mt-2">Try searching for something else</p>
          </div>
        )}
      </div>
    </div>
  )
}
