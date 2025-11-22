/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { feedUrl } = await request.json()

    if (!feedUrl) {
      return NextResponse.json({ error: "Feed URL is required" }, { status: 400 })
    }

    // Fetch the RSS feed with timeout and better headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Feed fetch failed: ${response.status} - ${feedUrl}`)

        // Return empty recipes array instead of error for better UX
        if (response.status === 404) {
          return NextResponse.json({
            recipes: [],
            warning: `Feed not found (404). The URL may be incorrect or the feed may have been removed.`
          })
        }

        if (response.status === 403 || response.status === 401) {
          return NextResponse.json({
            recipes: [],
            warning: `Access denied to feed. It may require authentication or block automated requests.`
          })
        }

        return NextResponse.json({
          recipes: [],
          warning: `Failed to fetch feed (HTTP ${response.status})`
        })
      }

      const xmlText = await response.text()

      // Check if we actually got XML
      if (!xmlText.includes('<rss') && !xmlText.includes('<feed') && !xmlText.includes('<?xml')) {
        return NextResponse.json({
          recipes: [],
          warning: 'Feed URL did not return valid RSS/XML content'
        })
      }

      // Parse RSS XML manually (simple parser for common RSS formats)
      const recipes = parseRSSFeed(xmlText)

      return NextResponse.json({ recipes })
    } catch (fetchErr: any) {
      clearTimeout(timeoutId)

      if (fetchErr.name === 'AbortError') {
        return NextResponse.json({
          recipes: [],
          warning: 'Feed request timed out after 10 seconds'
        })
      }

      throw fetchErr
    }
  } catch (err: any) {
    console.error("🚨 RSS parse error:", err)
    return NextResponse.json(
      { recipes: [], error: err.message || String(err), warning: 'Unable to parse feed' },
      { status: 200 } // Return 200 with empty recipes instead of 500
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
    let image =
      extractTag(item, 'media:content', 'url') ||
      extractTag(item, 'enclosure', 'url') ||
      extractTag(item, 'media:thumbnail', 'url') ||
      extractImageFromDescription(description)

    // Clean the image URL
    if (image) {
      image = cleanHtml(image)
    }

    if (title && link) {
      recipes.push({
        title: cleanHtml(title),
        link: cleanHtml(link),
        description: cleanHtml(stripHtmlTags(description)),
        image: image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image Available%3C/svg%3E',
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
