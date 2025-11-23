import { NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

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
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      )
    }

    // Fetch the webpage
    const response = await fetch(validUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.statusText}` },
        { status: response.status }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Try to extract recipe data from JSON-LD (Schema.org format)
    let recipe = extractFromJsonLd($)

    // If JSON-LD extraction failed, try HTML parsing
    if (!recipe || !recipe.title) {
      recipe = extractFromHtml($, validUrl.hostname)
    }

    if (!recipe || !recipe.title) {
      return NextResponse.json(
        { error: "Could not find recipe data on this page. Make sure the URL points to a recipe page." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      recipe: {
        ...recipe,
        sourceUrl: validUrl.toString(),
        sourceName: validUrl.hostname.replace(/^www\./, "")
      }
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return NextResponse.json(
      { error: "Failed to scrape recipe. Please try again." },
      { status: 500 }
    )
  }
}

function extractFromJsonLd($: cheerio.CheerioAPI): ScrapedRecipe | null {
  try {
    // Find all JSON-LD script tags
    const jsonLdScripts = $('script[type="application/ld+json"]')

    for (let i = 0; i < jsonLdScripts.length; i++) {
      const scriptContent = $(jsonLdScripts[i]).html()
      if (!scriptContent) continue

      try {
        const data = JSON.parse(scriptContent)

        // Handle array of JSON-LD objects
        const items = Array.isArray(data) ? data : [data]

        for (const item of items) {
          // Look for Recipe type (including nested in @graph)
          const recipe = findRecipeInJsonLd(item)
          if (recipe) {
            return parseRecipeJsonLd(recipe)
          }
        }
      } catch (e) {
        // Skip invalid JSON
        continue
      }
    }
  } catch (error) {
    console.error("JSON-LD extraction error:", error)
  }

  return null
}

function findRecipeInJsonLd(obj: any): any {
  if (!obj || typeof obj !== "object") return null

  // Check if this object is a Recipe
  const type = obj["@type"]
  if (type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))) {
    return obj
  }

  // Check in @graph array
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const recipe = findRecipeInJsonLd(item)
      if (recipe) return recipe
    }
  }

  return null
}

function parseRecipeJsonLd(data: any): ScrapedRecipe {
  // Helper to extract text from various formats
  const getText = (value: any): string => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (Array.isArray(value)) return value.join(", ")
    if (typeof value === "object" && value.text) return value.text
    if (typeof value === "object" && value["@value"]) return value["@value"]
    return ""
  }

  // Helper to parse duration (ISO 8601 format like PT30M or PT1H30M)
  const parseDuration = (duration: string): number => {
    if (!duration) return 0
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    if (!match) return 0
    const hours = parseInt(match[1] || "0")
    const minutes = parseInt(match[2] || "0")
    return hours * 60 + minutes
  }

  // Extract ingredients
  let ingredients: string[] = []
  if (data.recipeIngredient) {
    ingredients = Array.isArray(data.recipeIngredient)
      ? data.recipeIngredient.map((i: any) => getText(i))
      : [getText(data.recipeIngredient)]
  }

  // Extract instructions
  let instructions = ""
  if (data.recipeInstructions) {
    if (typeof data.recipeInstructions === "string") {
      instructions = data.recipeInstructions
    } else if (Array.isArray(data.recipeInstructions)) {
      instructions = data.recipeInstructions
        .map((step: any) => {
          if (typeof step === "string") return step
          if (step.text) return step.text
          if (step.itemListElement) {
            return Array.isArray(step.itemListElement)
              ? step.itemListElement.map((s: any) => getText(s.text || s)).join("\n")
              : getText(step.itemListElement)
          }
          return getText(step)
        })
        .filter(Boolean)
        .join("\n\n")
    }
  }

  // Extract image
  let image = ""
  if (data.image) {
    if (typeof data.image === "string") {
      image = data.image
    } else if (Array.isArray(data.image)) {
      image = data.image[0]
    } else if (data.image.url) {
      image = data.image.url
    }
  }

  // Extract video
  let videoUrl = ""
  if (data.video) {
    if (typeof data.video === "string") {
      videoUrl = data.video
    } else if (data.video.contentUrl) {
      videoUrl = data.video.contentUrl
    } else if (data.video.embedUrl) {
      videoUrl = data.video.embedUrl
    }
  }

  return {
    title: getText(data.name),
    description: getText(data.description),
    image,
    ingredients: ingredients.filter(Boolean),
    instructions: instructions.trim(),
    prepTime: data.prepTime ? parseDuration(data.prepTime) : undefined,
    cookTime: data.cookTime ? parseDuration(data.cookTime) : undefined,
    totalTime: data.totalTime ? parseDuration(data.totalTime) : undefined,
    servings: data.recipeYield ? parseInt(String(data.recipeYield)) : undefined,
    category: getText(data.recipeCategory),
    cuisine: getText(data.recipeCuisine),
    author: data.author ? getText(data.author.name || data.author) : undefined,
    videoUrl
  }
}

function extractFromHtml($: cheerio.CheerioAPI, hostname: string): ScrapedRecipe | null {
  try {
    // Try common HTML patterns
    const recipe: ScrapedRecipe = {
      title: "",
      ingredients: [],
      instructions: ""
    }

    // Extract title
    recipe.title =
      $('h1[class*="recipe-title"]').first().text().trim() ||
      $('h1[class*="title"]').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      $('title').text().trim()

    // Extract description
    recipe.description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('p[class*="description"]').first().text().trim()

    // Extract image
    recipe.image =
      $('meta[property="og:image"]').attr("content") ||
      $('img[class*="recipe-image"]').first().attr("src") ||
      $('img[class*="featured"]').first().attr("src")

    // Extract ingredients - try various selectors
    const ingredientSelectors = [
      'li[class*="ingredient"]',
      'li[class*="recipe-ingredient"]',
      '.ingredients li',
      '[itemprop="recipeIngredient"]'
    ]

    for (const selector of ingredientSelectors) {
      const items = $(selector)
      if (items.length > 0) {
        recipe.ingredients = items.map((_, el) => $(el).text().trim()).get().filter(Boolean)
        break
      }
    }

    // Extract instructions - try various selectors
    const instructionSelectors = [
      'li[class*="instruction"]',
      'li[class*="recipe-step"]',
      'li[class*="step"]',
      '.instructions li',
      '[itemprop="recipeInstructions"]'
    ]

    let instructionsList: string[] = []
    for (const selector of instructionSelectors) {
      const items = $(selector)
      if (items.length > 0) {
        instructionsList = items.map((_, el) => $(el).text().trim()).get().filter(Boolean)
        break
      }
    }

    if (instructionsList.length > 0) {
      recipe.instructions = instructionsList.map((step, idx) => `${idx + 1}. ${step}`).join("\n\n")
    } else {
      // Try to get instructions as a block of text
      recipe.instructions =
        $('[itemprop="recipeInstructions"]').text().trim() ||
        $('.instructions').text().trim()
    }

    // Only return if we found meaningful data
    if (recipe.title && (recipe.ingredients?.length || recipe.instructions)) {
      return recipe
    }
  } catch (error) {
    console.error("HTML extraction error:", error)
  }

  return null
}
