"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase-browser"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"

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
}

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Recipe demo state
  const [recipeUrl, setRecipeUrl] = useState("")
  const [isScrapingRecipe, setIsScrapingRecipe] = useState(false)
  const [scrapedRecipe, setScrapedRecipe] = useState<ScrapedRecipe | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [scrapeError, setScrapeError] = useState("")

  const handleLogin = async () => {
    setIsLoading(true)

    const origin =
      typeof window !== 'undefined' ? window.location.origin : ''

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Check your email for the login link.')
    }

    setIsLoading(false)
  }

  const handleScrapeRecipe = async () => {
    if (!recipeUrl.trim()) return

    setIsScrapingRecipe(true)
    setScrapeError("")

    try {
      const response = await fetch('/api/recipes/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: recipeUrl.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to scrape recipe')
      }

      const data = await response.json()
      setScrapedRecipe(data.recipe)
      setShowRecipeModal(true)
    } catch (error) {
      console.error('Error scraping recipe:', error)
      setScrapeError('Could not load this recipe. Try a different URL.')
    } finally {
      setIsScrapingRecipe(false)
    }
  }

  const exampleUrls = [
    { label: '📱 Instagram', url: 'https://www.instagram.com/p/example/' },
    { label: '🎵 TikTok', url: 'https://www.tiktok.com/@user/video/123' },
    { label: '📰 NYT', url: 'https://cooking.nytimes.com/recipes/12345-pasta' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-12 lg:gap-16 items-center">

          {/* LEFT SIDE - Hero & Demo */}
          <div className="space-y-8">
            {/* Logo & Headline */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">🍳</span>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">Eat</h1>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Stop asking<br />
                "what's for dinner?"
              </h2>

              <div className="space-y-2 text-lg text-gray-600">
                <p>Scan your groceries.</p>
                <p>Find recipes you can make.</p>
                <p>Track what you cook.</p>
              </div>
            </div>

            {/* Recipe URL Demo */}
            <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-gray-100">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Try it now:</h3>
                  <p className="text-sm text-gray-600">
                    Found a recipe on Instagram? TikTok? Any website?<br />
                    Paste the URL:
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={recipeUrl}
                    onChange={(e) => setRecipeUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recipeUrl.trim()) {
                        handleScrapeRecipe()
                      }
                    }}
                    disabled={isScrapingRecipe}
                    className="h-12 text-base"
                  />
                  <Button
                    onClick={handleScrapeRecipe}
                    disabled={isScrapingRecipe || !recipeUrl.trim()}
                    className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold whitespace-nowrap"
                  >
                    {isScrapingRecipe ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check it →'
                    )}
                  </Button>
                </div>

                {scrapeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{scrapeError}</p>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Popular examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleUrls.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRecipeUrl(example.url)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {example.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Sign Up */}
          <div className="lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get started free</h3>

              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email.trim()) {
                      handleLogin()
                    }
                  }}
                  disabled={isLoading}
                  className="h-12 text-base"
                />

                <Button
                  onClick={handleLogin}
                  disabled={isLoading || !email.trim()}
                  className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send magic link →'
                  )}
                </Button>

                {message && (
                  <div
                    className={`rounded-lg p-3 ${
                      message.startsWith("Error")
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <p className={`text-sm ${message.startsWith("Error") ? "text-red-700" : "text-green-700"}`}>
                      {message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Result Modal */}
      {showRecipeModal && scrapedRecipe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{scrapedRecipe.title}</h3>
              <button
                onClick={() => setShowRecipeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {scrapedRecipe.image && (
                <img
                  src={scrapedRecipe.image}
                  alt={scrapedRecipe.title}
                  className="w-full h-64 object-cover rounded-xl"
                />
              )}

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900 font-medium">
                  📸 To see if you can make this, scan your groceries
                </p>
              </div>

              {scrapedRecipe.ingredients && scrapedRecipe.ingredients.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Here's what this recipe needs:
                  </h4>
                  <ul className="space-y-2">
                    {scrapedRecipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <div className="bg-gradient-to-r from-green-50 to-orange-50 rounded-xl p-6 text-center space-y-4">
                  <p className="text-lg font-semibold text-gray-900">
                    🎉 Want to save this and track your kitchen?
                  </p>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                  />
                  <Button
                    onClick={async () => {
                      await handleLogin()
                      if (!message.startsWith("Error")) {
                        setShowRecipeModal(false)
                      }
                    }}
                    disabled={isLoading || !email.trim()}
                    className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Sign up & save this recipe →'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
