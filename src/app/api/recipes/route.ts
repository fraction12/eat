/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Get authenticated user's inventory from Supabase
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: items, error } = await supabase
      .from("inventory")
      .select("item")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        recipes: [],
        message: "No items in inventory. Add some ingredients first!"
      });
    }

    // Extract just the item names
    const ingredients = items.map((i: any) => i.item);

    // Call OpenAI to get recipe suggestions
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL_ID || "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful cooking assistant. Return ONLY valid JSON — no markdown, no explanations."
          },
          {
            role: "user",
            content: `I have these ingredients: ${ingredients.join(", ")}.

Suggest 3-5 recipes I can make. For each recipe, include:
- title: Recipe name
- description: Brief description (1-2 sentences)
- ingredients: Array of ingredients needed (highlight which ones I already have)
- instructions: Array of cooking steps
- missingIngredients: Array of key ingredients I don't have but would need

Return as a JSON array of recipe objects.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`OpenAI API error ${apiRes.status}: ${errText}`);
    }

    const apiJson = await apiRes.json();
    let raw = apiJson.choices?.[0]?.message?.content ?? "[]";

    // Strip code fences if present (``` or ```json)
    let rawContent = raw.trim();
    if (rawContent.startsWith("```")) {
      rawContent = rawContent.replace(/^```(?:json)?\s*/, "").replace(/```$/, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = [];
    }

    const recipes = Array.isArray(parsed) ? parsed : [];

    return NextResponse.json({ recipes });
  } catch (err: any) {
    console.error("🚨 Recipes route error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
