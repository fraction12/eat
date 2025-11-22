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
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [showAddFeedModal, setShowAddFeedModal] = useState(false)

  // Fetch user's feeds and add default if none exist
  useEffect(() => {
    fetchFeeds()
    fetchInventory()
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
    try {
      await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedUrl: "https://www.bonappetit.com/feed/recipes-rss-feed/rss",
          feedName: "Bon Appétit",
          feedDescription: "Award-winning recipes from Bon Appétit magazine",
        }),
      })
    } catch (error) {
      console.error("Failed to add default feed:", error)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Recipe Hub</h1>
              <p className="text-gray-600">Discover recipes from your favorite sources</p>
            </div>
            <Button onClick={() => setShowAddFeedModal(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Feed
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search recipes by name or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* RSS Feed Sections */}
        {isLoadingFeeds ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Loader2 className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading recipe feeds...</p>
          </div>
        ) : feeds.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Rss className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No recipe feeds yet</p>
            <p className="text-gray-400 text-sm mt-2">Add your first recipe feed to get started!</p>
            <Button onClick={() => setShowAddFeedModal(true)} className="mt-4 gap-2">
              <Plus className="h-5 w-5" />
              Add Your First Feed
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {feeds.map((feed) => (
              <div key={feed.id} className="bg-white rounded-2xl shadow-xl p-6">
                {/* Feed Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{feed.feed_name}</h3>
                    {feed.feed_description && (
                      <p className="text-sm text-gray-600 mt-1">{feed.feed_description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFeed(feed.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Recipes Grid */}
                {!feedRecipes[feed.id] ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 text-orange-600 animate-spin mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Loading recipes...</p>
                  </div>
                ) : feedRecipes[feed.id].length === 0 ? (
                  <div className="text-center py-8">
                    {feedWarnings[feed.id] ? (
                      <div className="max-w-md mx-auto">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                              <p className="font-semibold text-yellow-900 mb-1">Unable to load feed</p>
                              <p className="text-sm text-yellow-700">{feedWarnings[feed.id]}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">Try checking the feed URL or contact the feed provider.</p>
                      </div>
                    ) : (
                      <p className="text-gray-600">No recipes found in this feed</p>
                    )}
                  </div>
                ) : (() => {
                  const filteredRecipes = filterRecipes(feedRecipes[feed.id])
                  // Sort by inventory matches (highest first)
                  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
                    return canMakeRecipe(b) - canMakeRecipe(a)
                  })

                  return filteredRecipes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No recipes match your search</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedRecipes.map((recipe, idx) => {
                          const matchCount = canMakeRecipe(recipe)
                          const canMake = matchCount > 0

                          return (
                            <a
                              key={idx}
                              href={recipe.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`group bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all border-2 ${
                                canMake ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'
                              }`}
                            >
                              {/* Recipe Image */}
                              <div className="relative h-56 bg-gray-200 overflow-hidden">
                                <img
                                  src={recipe.image}
                                  alt={recipe.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image Available%3C/svg%3E"
                                  }}
                                />
                                {canMake && (
                                  <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg flex items-center gap-1.5">
                                    <Check className="h-4 w-4" />
                                    {matchCount} {matchCount === 1 ? 'ingredient' : 'ingredients'} in stock
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                  <ExternalLink className="h-5 w-5 text-gray-900" />
                                </div>
                              </div>

                              {/* Recipe Info */}
                              <div className="p-5">
                                <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors text-lg leading-tight mb-2">
                                  {recipe.title}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                  {recipe.description}
                                </p>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                      {feedRecipes[feed.id].length > filteredRecipes.length && (
                        <div className="text-center mt-6">
                          <p className="text-sm text-gray-500">
                            Showing {filteredRecipes.length} of {feedRecipes[feed.id].length} recipes
                          </p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            ))}
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
