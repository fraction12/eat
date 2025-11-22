"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, ExternalLink, Trash2, Rss, Search, Check, AlertCircle } from "lucide-react"
import { AddFeedModal } from "@/components/AddFeedModal"
import { supabase } from "@/lib/supabase"

type RSSRecipe = {
  title: string
  link: string
  description: string
  image: string
  pubDate: string
  source?: string
  category?: string
  area?: string
}

type Feed = {
  id: string
  feed_url: string
  feed_name: string
  feed_description: string | null
  created_at: string
}

type InventoryItem = {
  id: string
  item: string
  price: number
  quantity: number
  created_at: string
}

export default function RecipesPage() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [feedRecipes, setFeedRecipes] = useState<Record<string, RSSRecipe[]>>({})
  const [feedWarnings, setFeedWarnings] = useState<Record<string, string>>({})
  const [mealDBRecipes, setMealDBRecipes] = useState<RSSRecipe[]>([])
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true)
  const [isLoadingMealDB, setIsLoadingMealDB] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const recipesPerPage = 20

  const [showAddFeedModal, setShowAddFeedModal] = useState(false)

  // Fetch user's feeds and add default if none exist
  useEffect(() => {
    fetchFeeds()
    fetchInventory()
    fetchMealDBRecipes()
  }, [])

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setInventory(data as InventoryItem[])
    }
  }

  const fetchMealDBRecipes = async () => {
    setIsLoadingMealDB(true)
    try {
      const response = await fetch("/api/themealdb")
      if (response.ok) {
        const data = await response.json()
        setMealDBRecipes(data.recipes || [])
      }
    } catch (error) {
      console.error("Failed to fetch TheMealDB recipes:", error)
    } finally {
      setIsLoadingMealDB(false)
    }
  }

  const fetchFeeds = async () => {
    setIsLoadingFeeds(true)
    try {
      const response = await fetch("/api/feeds")
      if (response.ok) {
        const data = await response.json()
        let userFeeds = data.feeds || []

        // If no feeds exist, add Bon Appétit as default
        if (userFeeds.length === 0) {
          await addDefaultFeed()
          const response2 = await fetch("/api/feeds")
          if (response2.ok) {
            const data2 = await response2.json()
            userFeeds = data2.feeds || []
          }
        }

        setFeeds(userFeeds)

        // Fetch recipes for each feed
        for (const feed of userFeeds) {
          fetchFeedRecipes(feed.id, feed.feed_url)
        }
      }
    } catch (error) {
      console.error("Failed to fetch feeds:", error)
    } finally {
      setIsLoadingFeeds(false)
    }
  }

  const addDefaultFeed = async () => {
    const defaultFeeds = [
      {
        feedUrl: "https://www.bonappetit.com/feed/recipes-rss-feed/rss",
        feedName: "Bon Appétit",
        feedDescription: "Award-winning recipes from Bon Appétit magazine",
      },
      {
        feedUrl: "https://www.foodnetwork.com/feeds/rss/recipes",
        feedName: "Food Network",
        feedDescription: "Popular recipes from Food Network chefs",
      },
      {
        feedUrl: "https://www.seriouseats.com/feed",
        feedName: "Serious Eats",
        feedDescription: "Science-backed recipes and cooking techniques",
      },
      {
        feedUrl: "https://www.epicurious.com/services/rss/recipes",
        feedName: "Epicurious",
        feedDescription: "Recipes from Epicurious and Condé Nast",
      },
      {
        feedUrl: "https://www.bbcgoodfood.com/rss/recipes",
        feedName: "BBC Good Food",
        feedDescription: "Trusted recipes from BBC Good Food",
      },
      {
        feedUrl: "https://www.jamieoliver.com/feeds/recipes/",
        feedName: "Jamie Oliver",
        feedDescription: "Delicious recipes from Jamie Oliver",
      },
      {
        feedUrl: "https://food52.com/recipes.rss",
        feedName: "Food52",
        feedDescription: "Community recipes and cooking inspiration",
      },
      {
        feedUrl: "https://www.simplyrecipes.com/feed/",
        feedName: "Simply Recipes",
        feedDescription: "Simple, tested, and trusted recipes",
      },
      {
        feedUrl: "https://thepioneerwoman.com/food-cooking/recipes/feed/",
        feedName: "The Pioneer Woman",
        feedDescription: "Comfort food recipes from Ree Drummond",
      },
      {
        feedUrl: "https://minimalistbaker.com/feed/",
        feedName: "Minimalist Baker",
        feedDescription: "Simple recipes requiring 10 ingredients or less",
      },
      {
        feedUrl: "https://www.budgetbytes.com/feed/",
        feedName: "Budget Bytes",
        feedDescription: "Delicious recipes on a budget",
      },
      {
        feedUrl: "https://smittenkitchen.com/feed/",
        feedName: "Smitten Kitchen",
        feedDescription: "Fearless cooking from a tiny kitchen",
      },
      {
        feedUrl: "https://www.allrecipes.com/recipes/rss/",
        feedName: "Allrecipes",
        feedDescription: "Home cooking recipes from the community",
      },
      {
        feedUrl: "https://www.taste.com.au/recipes/collections/rss",
        feedName: "Taste.com.au",
        feedDescription: "Australian recipes and cooking ideas",
      },
      {
        feedUrl: "https://www.delish.com/rss/all.xml/",
        feedName: "Delish",
        feedDescription: "Fun and easy recipes for every occasion",
      },
    ]

    console.log("Adding 15 default recipe feeds...")

    // Add all feeds in parallel
    try {
      await Promise.all(
        defaultFeeds.map(async (feed) => {
          try {
            await fetch("/api/feeds", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(feed),
            })
          } catch (error) {
            console.error(`Failed to add feed: ${feed.feedName}`, error)
          }
        })
      )
    } catch (error) {
      console.error("Failed to add default feeds:", error)
    }
  }

  const fetchFeedRecipes = async (feedId: string, feedUrl: string) => {
    try {
      const response = await fetch("/api/rss/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        setFeedRecipes((prev) => ({ ...prev, [feedId]: data.recipes || [] }))

        // Store warning if present
        if (data.warning) {
          setFeedWarnings((prev) => ({ ...prev, [feedId]: data.warning }))
        }
      } else {
        setFeedRecipes((prev) => ({ ...prev, [feedId]: [] }))
        setFeedWarnings((prev) => ({ ...prev, [feedId]: 'Failed to load feed' }))
      }
    } catch (error) {
      console.error(`Failed to fetch recipes for feed ${feedId}:`, error)
      setFeedRecipes((prev) => ({ ...prev, [feedId]: [] }))
      setFeedWarnings((prev) => ({ ...prev, [feedId]: 'Network error loading feed' }))
    }
  }

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm("Are you sure you want to remove this feed?")) return

    try {
      const response = await fetch(`/api/feeds?id=${feedId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFeeds(feeds.filter((f) => f.id !== feedId))
        setFeedRecipes((prev) => {
          const { [feedId]: _, ...rest } = prev
          return rest
        })
      }
    } catch (error) {
      console.error("Failed to delete feed:", error)
      alert("Failed to delete feed")
    }
  }

  // Check if recipe can be made with inventory items
  const canMakeRecipe = (recipe: RSSRecipe): number => {
    if (inventory.length === 0) return 0

    const recipeText = `${recipe.title} ${recipe.description}`.toLowerCase()
    let matchCount = 0

    inventory.forEach((item) => {
      const itemName = item.item.toLowerCase()
      // Check for whole word matches
      const regex = new RegExp(`\\b${itemName}\\b`, 'i')
      if (regex.test(recipeText)) {
        matchCount++
      }
    })

    return matchCount
  }

  // Filter recipes based on search query
  const filterRecipes = (recipes: RSSRecipe[]) => {
    if (!searchQuery.trim()) return recipes

    const query = searchQuery.toLowerCase()
    return recipes.filter((recipe) => {
      const searchText = `${recipe.title} ${recipe.description}`.toLowerCase()
      return searchText.includes(query)
    })
  }

  // Combine all recipes from all sources
  const getAllRecipes = (): RSSRecipe[] => {
    const allRecipes: RSSRecipe[] = []

    // Add RSS feed recipes
    Object.entries(feedRecipes).forEach(([feedId, recipes]) => {
      const feed = feeds.find((f) => f.id === feedId)
      const recipesWithSource = recipes.map((recipe) => ({
        ...recipe,
        source: feed?.feed_name || "RSS Feed",
      }))
      allRecipes.push(...recipesWithSource)
    })

    // Add TheMealDB recipes
    allRecipes.push(...mealDBRecipes)

    return allRecipes
  }

  // Get paginated recipes
  const getPaginatedRecipes = () => {
    const allRecipes = getAllRecipes()
    const filtered = filterRecipes(allRecipes)

    // Sort by inventory matches (highest first)
    const sorted = [...filtered].sort((a, b) => {
      return canMakeRecipe(b) - canMakeRecipe(a)
    })

    const startIndex = (currentPage - 1) * recipesPerPage
    const endIndex = startIndex + recipesPerPage
    const paginated = sorted.slice(startIndex, endIndex)

    return {
      recipes: paginated,
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / recipesPerPage),
    }
  }

  const { recipes: paginatedRecipes, total, totalPages } = getPaginatedRecipes()
  const isLoading = isLoadingFeeds || isLoadingMealDB

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Recipe Hub</h1>
              <p className="text-gray-600">Discover recipes from RSS feeds and TheMealDB</p>
            </div>
            <Button onClick={() => setShowAddFeedModal(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add RSS Feed
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes by name or ingredients..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
              className="pl-10 pr-4 py-6 text-lg rounded-xl border-2 border-gray-200 focus:border-orange-500"
            />
            {inventory.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{inventory.length} items in inventory</span>
              </div>
            )}
          </div>
        </div>

        {/* Unified Recipe Table */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Loader2 className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading recipes from all sources...</p>
          </div>
        ) : paginatedRecipes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Rss className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {total === 0 ? "No recipes found" : "No recipes match your search"}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {total === 0 ? "Add RSS feeds or check back later for TheMealDB recipes" : "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Table Header with Count */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Recipes ({total} total)
                </h2>
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </div>

            {/* Recipe Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingredients Match
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRecipes.map((recipe, idx) => {
                    const matchCount = canMakeRecipe(recipe)
                    const canMake = matchCount > 0

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-gray-50 transition-colors ${
                          canMake ? 'bg-green-50/50' : ''
                        }`}
                      >
                        {/* Recipe Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23e5e7eb' width='64' height='64'/%3E%3C/svg%3E"
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 line-clamp-1">
                                {recipe.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                                {recipe.description}
                              </p>
                              {recipe.category && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                  {recipe.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{recipe.source || "Unknown"}</span>
                          {recipe.area && (
                            <p className="text-xs text-gray-500 mt-1">{recipe.area}</p>
                          )}
                        </td>

                        {/* Ingredients Match */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {canMake ? (
                            <div className="flex items-center gap-1.5 text-green-700">
                              <Check className="h-4 w-4" />
                              <span className="text-sm font-semibold">
                                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a
                            href={recipe.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium text-sm"
                          >
                            View Recipe
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * recipesPerPage + 1} to{" "}
                    {Math.min(currentPage * recipesPerPage, total)} of {total} recipes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Feed Modal */}
      <AddFeedModal
        isOpen={showAddFeedModal}
        onClose={() => setShowAddFeedModal(false)}
        onFeedAdded={fetchFeeds}
      />
    </div>
  )
}
