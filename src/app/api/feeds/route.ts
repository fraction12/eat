/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const runtime = "nodejs"

// GET - List all feeds for the user
export async function GET() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: feeds, error } = await supabase
      .from("recipe_feeds")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({ feeds: feeds || [] })
  } catch (err: any) {
    console.error("🚨 Feeds list error:", err)
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    )
  }
}

// POST - Add a new feed
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { feedUrl, feedName, feedDescription } = await request.json()

    if (!feedUrl || !feedName) {
      return NextResponse.json(
        { error: "Feed URL and name are required" },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Insert the new feed
    const { data, error } = await supabase
      .from("recipe_feeds")
      .insert({
        user_id: user.id,
        feed_url: feedUrl,
        feed_name: feedName,
        feed_description: feedDescription || null,
      })
      .select()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({ feed: data?.[0] })
  } catch (err: any) {
    console.error("🚨 Add feed error:", err)
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    )
  }
}

// DELETE - Remove a feed
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const feedId = searchParams.get("id")

    if (!feedId) {
      return NextResponse.json({ error: "Feed ID is required" }, { status: 400 })
    }

    // Delete only if the feed belongs to the authenticated user
    const { error } = await supabase
      .from("recipe_feeds")
      .delete()
      .eq("id", feedId)
      .eq("user_id", user.id)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("🚨 Delete feed error:", err)
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    )
  }
}
