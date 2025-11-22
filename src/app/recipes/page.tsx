"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2, Plus, ExternalLink, Trash2, Rss, Search, Check, AlertCircle,
  Heart, Filter, ArrowUpDown, Sparkles, ChefHat, Clock, Users
} from "lucide-react"
import { AddFeedModal } from "@/components/AddFeedModal"
import { ManageFeedsModal } from "@/components/ManageFeedsModal"
import { ToastContainer, showToast } from "@/components/Toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"

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

type Favorite = {
  id: string
  recipe_title: string
  recipe_link: string
  recipe_image: string
  recipe_source: string
  recipe_description: string
  created_at: string
}

export default function RecipesPage() {
  const { user } = useAuth()
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [feedRecipes, setFeedRecipes] = useState<Record<string, RSSRecipe[]>>({})
  const [feedWarnings, setFeedWarnings] = useState<Record<string, string>>({})
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const recipesPerPage = 10

  // Sorting and filtering
  const [sortBy, setSortBy] = useState<"match" | "name" | "source" | "date">("match")
  const [filterSource, setFilterSource] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const [showAddFeedModal, setShowAddFeedModal] = useState(false)
  const [showManageFeedsModal, setShowManageFeedsModal] = useState(false)

  // Fetch user's feeds and add default if none exist
  useEffect(() => {
    if (user) {
      fetchFeeds()
      fetchInventory()
      fetchFavorites()
    }
  }, [user])

  const fetchInventory = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setInventory(data as InventoryItem[])
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites")
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites || [])
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
    }
  }

  const isFavorite = (recipeLink: string): boolean => {
    return favorites.some((fav) => fav.recipe_link === recipeLink)
  }

  const toggleFavorite = async (recipe: RSSRecipe) => {
    const favorited = isFavorite(recipe.link)

    if (favorited) {
      // Remove from favorites
      try {
        const response = await fetch(`/api/favorites?recipe_link=${encodeURIComponent(recipe.link)}`, {
          method: "DELETE",
        })

        if (response.ok) {
          // Refetch to ensure consistency
          await fetchFavorites()
          showToast("success", "Removed from favorites")
        } else {
          showToast("error", "Failed to remove from favorites")
        }
      } catch (error) {
        console.error("Failed to remove favorite:", error)
        showToast("error", "Failed to remove from favorites")
      }
    } else {
      // Add to favorites
      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe_title: recipe.title,
            recipe_link: recipe.link,
            recipe_image: recipe.image,
            recipe_source: recipe.source || "Unknown",
            recipe_description: recipe.description,
          }),
        })

        if (response.ok) {
          // Refetch to ensure consistency
          await fetchFavorites()
          showToast("success", "Added to favorites")
        } else {
          showToast("error", "Failed to add to favorites")
        }
      } catch (error) {
        console.error("Failed to add favorite:", error)
        showToast("error", "Failed to add to favorites")
      }
    }
  }

  const fetchFeeds = async () => {
    setIsLoadingFeeds(true)
    try {
      const response = await fetch("/api/feeds")
      if (response.ok) {
        const data = await response.json()
        let userFeeds = data.feeds || []

        // Auto-add default feeds if none exist
        if (userFeeds.length === 0) {
          showToast("info", "Setting up your recipe feeds...")
          await addDefaultFeed()
          const response2 = await fetch("/api/feeds")
          if (response2.ok) {
            const data2 = await response2.json()
            userFeeds = data2.feeds || []
            if (userFeeds.length > 0) {
              showToast("success", `Added ${userFeeds.length} recipe feeds!`)
            }
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
      showToast("error", "Failed to load recipe feeds")
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
        showToast("success", "Feed removed successfully")
      } else {
        showToast("error", "Failed to remove feed")
      }
    } catch (error) {
      console.error("Failed to delete feed:", error)
      showToast("error", "Failed to remove feed")
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

    // If showing favorites only, ensure all favorites are included
    // (even if they're from feeds that are no longer active)
    if (showFavoritesOnly) {
      const feedRecipeLinks = new Set(allRecipes.map(r => r.link))

      favorites.forEach((fav) => {
        if (!feedRecipeLinks.has(fav.recipe_link)) {
          // Add favorite as a recipe if it's not in the feed recipes
          allRecipes.push({
            title: fav.recipe_title,
            link: fav.recipe_link,
            description: fav.recipe_description,
            image: fav.recipe_image,
            pubDate: fav.created_at,
            source: fav.recipe_source,
          })
        }
      })
    }

    return allRecipes
  }

  // Get paginated recipes
  const getPaginatedRecipes = () => {
    let allRecipes = getAllRecipes()

    // Filter by search query
    allRecipes = filterRecipes(allRecipes)

    // Filter by favorites
    if (showFavoritesOnly) {
      const favoriteLinks = new Set(favorites.map((f) => f.recipe_link))
      allRecipes = allRecipes.filter((recipe) => favoriteLinks.has(recipe.link))
    }

    // Filter by source
    if (filterSource !== "all") {
      allRecipes = allRecipes.filter((recipe) => recipe.source === filterSource)
    }

    // Filter by category
    if (filterCategory !== "all") {
      allRecipes = allRecipes.filter((recipe) => recipe.category === filterCategory)
    }

    // Sort recipes
    const sorted = [...allRecipes].sort((a, b) => {
      switch (sortBy) {
        case "match":
          return canMakeRecipe(b) - canMakeRecipe(a)
        case "name":
          return a.title.localeCompare(b.title)
        case "source":
          return (a.source || "").localeCompare(b.source || "")
        case "date":
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        default:
          return 0
      }
    })

    const startIndex = (currentPage - 1) * recipesPerPage
    const endIndex = startIndex + recipesPerPage
    const paginated = sorted.slice(startIndex, endIndex)

    return {
      recipes: paginated,
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / recipesPerPage),
      allRecipes: sorted,
    }
  }

  // Get unique sources and categories for filters
  const getFilterOptions = () => {
    const allRecipes = getAllRecipes()
    const sources = new Set<string>()
    const categories = new Set<string>()

    allRecipes.forEach((recipe) => {
      if (recipe.source) sources.add(recipe.source)
      if (recipe.category) categories.add(recipe.category)
    })

    return {
      sources: Array.from(sources).sort(),
      categories: Array.from(categories).sort(),
    }
  }

  const { sources: availableSources, categories: availableCategories } = getFilterOptions()
  const getRandomRecipe = () => {
    const { allRecipes } = getPaginatedRecipes()
    if (allRecipes.length === 0) return

    const random = allRecipes[Math.floor(Math.random() * allRecipes.length)]
    window.open(random.link, "_blank")
  }

  // Get top 5 featured recipes
  const getTop5Recipes = () => {
    const { allRecipes } = getPaginatedRecipes()
    return allRecipes.slice(0, 5)
  }

  const { recipes: paginatedRecipes, total, totalPages } = getPaginatedRecipes()
  const top5Recipes = getTop5Recipes()
  const isLoading = isLoadingFeeds

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">Recipe Hub</h1>
              <p className="text-sm sm:text-base text-gray-600">
                <span className="hidden sm:inline">Discover recipes from your favorite RSS feeds • {feeds.length} feeds active</span>
                <span className="sm:hidden">{feeds.length} active feed{feeds.length !== 1 ? 's' : ''}</span>
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 shrink-0">
              <Button
                onClick={() => setShowManageFeedsModal(true)}
                size="lg"
                variant="outline"
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Rss className="h-5 w-5" />
                <span className="hidden sm:inline">Manage Feeds ({feeds.length})</span>
                <span className="sm:hidden">Manage</span>
              </Button>
              <Button onClick={() => setShowAddFeedModal(true)} size="lg" className="gap-2 flex-1 sm:flex-initial">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Add Feed</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Top 5 Featured Recipes */}
        {!isLoading && top5Recipes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-orange-500" />
              Top Picks For You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {top5Recipes.map((recipe, idx) => {
                const matchCount = canMakeRecipe(recipe)
                const canMake = matchCount > 0
                const favorited = isFavorite(recipe.link)

                return (
                  <div
                    key={idx}
                    className={`group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${
                      canMake ? 'ring-2 ring-green-400' : ''
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/svg%3E"
                        }}
                      />

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleFavorite(recipe)
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
                          favorited
                            ? "bg-white/90 text-red-500"
                            : "bg-black/30 text-white hover:bg-white/90 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
                      </button>

                      {/* Match Badge */}
                      {canMake && (
                        <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {matchCount} match{matchCount > 1 ? 'es' : ''}
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 text-sm leading-tight">
                        {recipe.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-3">
                        {recipe.category && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {recipe.category}
                          </span>
                        )}
                        {recipe.source && (
                          <span className="text-xs text-gray-500 truncate">
                            {recipe.source}
                          </span>
                        )}
                      </div>

                      <a
                        href={recipe.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                      >
                        <ChefHat className="h-4 w-4" />
                        Cook This
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Search and Filters Section */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search recipes by name or ingredients..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 py-6 text-lg rounded-xl border-2 border-gray-200 focus:border-orange-500"
              />
            </div>
            {inventory.length > 0 && (
              <div className="mt-3 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg w-fit">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {inventory.length} ingredient{inventory.length !== 1 ? 's' : ''} in your inventory
                </span>
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Sort By */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="match">Best Match</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="source">Source</option>
                  <option value="date">Newest First</option>
                </select>
              </div>

              {/* Filter by Source */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  Source
                </label>
                <select
                  value={filterSource}
                  onChange={(e) => {
                    setFilterSource(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="all">All Sources ({availableSources.length})</option>
                  {availableSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Category */}
              {availableCategories.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5" />
                    Category
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="all">All Categories</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Actions in grid */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Quick Actions
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowFavoritesOnly(!showFavoritesOnly)
                      setCurrentPage(1)
                    }}
                    variant={showFavoritesOnly ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 flex-1"
                  >
                    <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
                    <span className="hidden sm:inline">Favorites</span>
                    <span className="text-xs">({favorites.length})</span>
                  </Button>
                  <Button
                    onClick={getRandomRecipe}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 hover:from-orange-600 hover:to-pink-600"
                    title="Get a random recipe"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters & Clear */}
            {(searchQuery || filterSource !== "all" || filterCategory !== "all" || showFavoritesOnly) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500">Active filters:</span>
                {searchQuery && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                    Search: "{searchQuery}"
                  </span>
                )}
                {filterSource !== "all" && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Source: {filterSource}
                  </span>
                )}
                {filterCategory !== "all" && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    Category: {filterCategory}
                  </span>
                )}
                {showFavoritesOnly && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-current" />
                    Favorites only
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setFilterSource("all")
                    setFilterCategory("all")
                    setShowFavoritesOnly(false)
                    setCurrentPage(1)
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 underline ml-2"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{total}</span> recipe{total !== 1 ? 's' : ''}
              {searchQuery && <span> matching "{searchQuery}"</span>}
            </p>
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
              {total === 0 ? "Add RSS feeds to get started" : "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Recipe Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Recipe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden md:table-cell">
                      Source
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide hidden lg:table-cell">
                      Match
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRecipes.map((recipe, idx) => {
                    const matchCount = canMakeRecipe(recipe)
                    const canMake = matchCount > 0

                    return (
                      <tr
                        key={idx}
                        className={`transition-all duration-150 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        } ${
                          canMake ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-transparent'
                        } hover:bg-orange-50/30 hover:shadow-sm`}
                      >
                        {/* Recipe Info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="w-14 h-14 rounded-lg object-cover shadow-sm ring-1 ring-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23e5e7eb' width='64' height='64'/%3E%3C/svg%3E"
                                }}
                              />
                              {canMake && (
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">
                                  {matchCount}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-0.5">
                                {recipe.title}
                              </h3>
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {recipe.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {recipe.category && (
                                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">
                                    {recipe.category}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 md:hidden">
                                  {recipe.source || "Unknown"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-sm font-medium text-gray-900">
                            {recipe.source || "Unknown"}
                          </div>
                          {recipe.area && (
                            <div className="text-xs text-gray-500 mt-0.5">{recipe.area}</div>
                          )}
                        </td>

                        {/* Ingredients Match */}
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          {canMake ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                              <Check className="h-3.5 w-3.5" />
                              <span className="text-xs font-bold">
                                {matchCount}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                toggleFavorite(recipe)
                              }}
                              className={`p-2 rounded-lg transition-all ${
                                isFavorite(recipe.link)
                                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              }`}
                              title={isFavorite(recipe.link) ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart
                                className={`h-4 w-4 ${isFavorite(recipe.link) ? "fill-current" : ""}`}
                              />
                            </button>
                            <a
                              href={recipe.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 hover:shadow-md transition-all text-xs font-semibold"
                            >
                              <ChefHat className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Cook</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">
                    Showing <span className="text-orange-600 font-bold">{(currentPage - 1) * recipesPerPage + 1}</span> to{" "}
                    <span className="text-orange-600 font-bold">{Math.min(currentPage * recipesPerPage, total)}</span> of{" "}
                    <span className="text-orange-600 font-bold">{total}</span> recipes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-xs"
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
                            className={`w-8 h-8 p-0 text-xs ${
                              currentPage === pageNum ? "bg-orange-500 hover:bg-orange-600" : ""
                            }`}
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
                      className="text-xs"
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

      <ManageFeedsModal
        isOpen={showManageFeedsModal}
        onClose={() => setShowManageFeedsModal(false)}
        feeds={feeds}
        onDeleteFeed={handleDeleteFeed}
        feedWarnings={feedWarnings}
      />

      <ToastContainer />
    </div>
  )
}
