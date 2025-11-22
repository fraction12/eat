/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { feedUrl } = await request.json()

    if (!feedUrl) {
      return NextResponse.json({ error: "Feed URL is required" }, { status: 400 })
    }

    // Fetch the RSS feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`)
    }

    const xmlText = await response.text()

    // Parse RSS XML manually (simple parser for common RSS formats)
    const recipes = parseRSSFeed(xmlText)

    return NextResponse.json({ recipes })
  } catch (err: any) {
    console.error("🚨 RSS parse error:", err)
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    )
  }
}

function parseRSSFeed(xmlText: string): any[] {
  const recipes: any[] = []

  // Simple regex-based XML parsing (works for most RSS feeds)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  const items = xmlText.match(itemRegex) || []

  items.forEach((item) => {
    // Extract fields
    const title = extractTag(item, 'title')
    const link = extractTag(item, 'link')
    const description = extractTag(item, 'description')
    const pubDate = extractTag(item, 'pubDate')

    // Try to extract image from various possible tags
    const image =
      extractTag(item, 'media:content', 'url') ||
      extractTag(item, 'enclosure', 'url') ||
      extractImageFromDescription(description)

    if (title && link) {
      recipes.push({
        title: cleanHtml(title),
        link: cleanHtml(link),
        description: cleanHtml(stripHtmlTags(description)),
        image: image || '/placeholder-recipe.jpg',
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      })
    }
  })

  return recipes.slice(0, 20) // Limit to 20 recipes
}

function extractTag(xml: string, tagName: string, attribute?: string): string {
  if (attribute) {
    const regex = new RegExp(`<${tagName}[^>]*${attribute}=["']([^"']*)["']`, 'i')
    const match = xml.match(regex)
    return match ? match[1] : ''
  }

  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : ''
}

function extractImageFromDescription(description: string): string {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i
  const match = description.match(imgRegex)
  return match ? match[1] : ''
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
}

function cleanHtml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}
