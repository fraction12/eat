"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function Auth() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  // Recipe demo state
  const [recipeUrl, setRecipeUrl] = useState("")
  const [isScrapingRecipe, setIsScrapingRecipe] = useState(false)
  const [scrapedRecipe, setScrapedRecipe] = useState<ScrapedRecipe | null>(null)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [scrapeError, setScrapeError] = useState("")

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/inventory`,
        },
      })

      if (error) throw error

      setEmailSent(true)
      setMessage("Check your email for the magic link!")
    } catch (error: any) {
      setMessage(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
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
    { label: '📰 NYT Recipe', url: 'https://cooking.nytimes.com/recipes/762489991-spinach-corn-dip' },
  ]

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Check your email!
              </h3>
              <p className="text-gray-600 mb-4">
                We sent a magic link to <br />
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Click the link in the email to sign in. <br />
                The link expires in 1 hour.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEmailSent(false)
                setEmail("")
                setMessage("")
              }}
              className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-9xl animate-pulse">🥗</div>
        <div className="absolute top-40 right-20 text-8xl animate-bounce">🍕</div>
        <div className="absolute bottom-20 left-1/4 text-7xl animate-pulse delay-100">🥘</div>
        <div className="absolute bottom-40 right-1/4 text-9xl animate-bounce delay-200">🍜</div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* LEFT SIDE - Hero & Demo */}
          <div className="space-y-8">
            {/* Logo & Headline */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                <span className="text-4xl">🍳</span>
                <h1 className="text-3xl font-black text-white">Eat</h1>
              </div>

              <h2 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
                Stop asking<br />
                <span className="text-yellow-300">"what's for dinner?"</span>
              </h2>

              <div className="flex flex-wrap gap-3">
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                  <p className="text-white font-medium">📸 Scan groceries</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                  <p className="text-white font-medium">🍽️ Find recipes</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                  <p className="text-white font-medium">👨‍🍳 Track cooking</p>
                </div>
              </div>
            </div>

            {/* Recipe URL Demo */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 lg:p-8 border-2 border-white/50">
              <div className="space-y-4">
                <div>
                  <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    ✨ TRY IT NOW
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Paste any recipe URL</h3>
                  <p className="text-sm text-gray-600">
                    NYT Cooking, Bon Appétit, or any recipe site. We'll check if you can make it.
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
                    className="h-14 text-base border-2 border-gray-300 focus:border-orange-500 rounded-xl"
                  />
                  <Button
                    onClick={handleScrapeRecipe}
                    disabled={isScrapingRecipe || !recipeUrl.trim()}
                    className="h-14 px-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-base whitespace-nowrap rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    {isScrapingRecipe ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
                  <p className="text-xs font-semibold text-gray-500 mb-2">QUICK TEST:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleUrls.map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setRecipeUrl(example.url)}
                        className="text-sm px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 rounded-full font-medium transition-all shadow-sm hover:shadow border border-gray-200"
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
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-white/50">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-gray-900">Get started</h3>
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-14 text-base border-2 border-gray-300 focus:border-purple-500 rounded-xl"
                />

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending magic...
                    </>
                  ) : (
                    'Send magic link ✨'
                  )}
                </Button>

                {message && !emailSent && (
                  <div
                    className={`rounded-lg p-3 ${
                      message.includes("error") || message.includes("Error")
                        ? "bg-red-50 border border-red-200"
                        : "bg-green-50 border border-green-200"
                    }`}
                  >
                    <p className={`text-sm ${
                      message.includes("error") || message.includes("Error")
                        ? "text-red-700"
                        : "text-green-700"
                    }`}>
                      {message}
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Result Modal */}
      {showRecipeModal && scrapedRecipe && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-200">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-5 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-2xl font-black text-white">{scrapedRecipe.title}</h3>
              <button
                onClick={() => setShowRecipeModal(false)}
                className="text-white/80 hover:text-white transition-colors bg-white/20 rounded-full p-2 hover:bg-white/30"
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
                  onError={(e) => {
                    // Hide image if it fails to load (CORS or other issues)
                    e.currentTarget.style.display = 'none'
                  }}
                  crossOrigin="anonymous"
                />
              )}

              <div className="bg-gradient-to-r from-orange-100 to-pink-100 border-2 border-orange-300 rounded-2xl p-5">
                <p className="text-base text-orange-900 font-bold">
                  📸 Sign up and scan your groceries to see if you can make this!
                </p>
              </div>

              {scrapedRecipe.ingredients && scrapedRecipe.ingredients.length > 0 && (
                <div>
                  <h4 className="text-2xl font-black text-gray-900 mb-4">
                    Ingredients needed:
                  </h4>
                  <ul className="space-y-3 bg-gray-50 rounded-2xl p-6">
                    {scrapedRecipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-2xl">✓</span>
                        <span className="text-gray-700 text-lg">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t-2 border-gray-200 pt-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-center space-y-5">
                  <div>
                    <p className="text-2xl font-black text-white mb-2">
                      Ready to cook smarter? 🎉
                    </p>
                    <p className="text-white/90 text-sm">
                      Save this recipe and start tracking your kitchen
                    </p>
                  </div>
                  <form onSubmit={handleMagicLink} className="space-y-3">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-14 text-base border-2 border-white/50 bg-white/90 rounded-xl"
                    />
                    <Button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full h-14 bg-white text-purple-600 hover:bg-gray-100 font-black text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending magic...
                        </>
                      ) : (
                        'Sign up & save recipe ✨'
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
