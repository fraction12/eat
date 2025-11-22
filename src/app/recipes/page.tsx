"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, ExternalLink, Trash2, Rss } from "lucide-react"
import { RecipeCarousel } from "@/components/RecipeCarousel"
import { AddFeedModal } from "@/components/AddFeedModal"

type AIRecipe = {
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  missingIngredients?: string[]
}

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

export default function RecipesPage() {
  const [aiRecipes, setAiRecipes] = useState<AIRecipe[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(true)

  const [feeds, setFeeds] = useState<Feed[]>([])
  const [feedRecipes, setFeedRecipes] = useState<Record<string, RSSRecipe[]>>({})
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true)

  const [showAddFeedModal, setShowAddFeedModal] = useState(false)

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

  // Fetch user's feeds and add default if none exist
  useEffect(() => {
    fetchFeeds()
  }, [])

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
      }
    } catch (error) {
      console.error(`Failed to fetch recipes for feed ${feedId}:`, error)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Recipe Hub</h1>
          <p className="text-gray-600">Discover recipes from your favorite sources and see what you can cook</p>
        </div>

        {/* AI-Suggested Recipes Carousel */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Based on Your Inventory</h2>
          {isLoadingAI ? (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Analyzing your inventory...</p>
            </div>
          ) : (
            <RecipeCarousel recipes={aiRecipes.slice(0, 5)} />
          )}
        </div>

        {/* RSS Feeds Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recipe Feeds</h2>
          <Button onClick={() => setShowAddFeedModal(true)} className="gap-2">
            <Plus className="h-5 w-5" />
            Add Feed
          </Button>
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
                    <h3 className="text-xl font-bold text-gray-900">{feed.feed_name}</h3>
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
                    <p className="text-gray-600">No recipes found in this feed</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {feedRecipes[feed.id].slice(0, 8).map((recipe, idx) => (
                      <a
                        key={idx}
                        href={recipe.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                      >
                        {/* Recipe Image */}
                        <div className="relative h-48 bg-gray-200 overflow-hidden">
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/svg%3E"
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4 text-gray-900" />
                          </div>
                        </div>

                        {/* Recipe Info */}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {recipe.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {recipe.description}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {feedRecipes[feed.id] && feedRecipes[feed.id].length > 8 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">
                      Showing 8 of {feedRecipes[feed.id].length} recipes
                    </p>
                  </div>
                )}
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
