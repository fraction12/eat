/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Common kitchen staples templates
const TEMPLATES: Record<string, any[]> = {
  "pantry staples": [
    { item: "Rice", quantity: 2, unit: "lb", category: "pantry", price: 0 },
    { item: "Pasta", quantity: 1, unit: "lb", category: "pantry", price: 0 },
    { item: "Flour", quantity: 5, unit: "lb", category: "pantry", price: 0 },
    { item: "Sugar", quantity: 2, unit: "lb", category: "pantry", price: 0 },
    { item: "Salt", quantity: 1, unit: "count", category: "condiments", price: 0 },
    { item: "Black Pepper", quantity: 1, unit: "count", category: "condiments", price: 0 },
    { item: "Olive Oil", quantity: 1, unit: "count", category: "condiments", price: 0 },
    { item: "Vegetable Oil", quantity: 1, unit: "count", category: "condiments", price: 0 },
    { item: "Canned Tomatoes", quantity: 2, unit: "count", category: "pantry", price: 0 },
    { item: "Canned Beans", quantity: 2, unit: "count", category: "pantry", price: 0 },
  ],
  "dairy basics": [
    { item: "Milk", quantity: 1, unit: "gal", category: "dairy", price: 0 },
    { item: "Eggs", quantity: 12, unit: "count", category: "dairy", price: 0 },
    { item: "Butter", quantity: 1, unit: "lb", category: "dairy", price: 0 },
    { item: "Cheese", quantity: 1, unit: "lb", category: "dairy", price: 0 },
    { item: "Yogurt", quantity: 1, unit: "count", category: "dairy", price: 0 },
  ],
  "produce essentials": [
    { item: "Onions", quantity: 2, unit: "lb", category: "produce", price: 0 },
    { item: "Garlic", quantity: 1, unit: "count", category: "produce", price: 0 },
    { item: "Potatoes", quantity: 5, unit: "lb", category: "produce", price: 0 },
    { item: "Tomatoes", quantity: 1, unit: "lb", category: "produce", price: 0 },
    { item: "Carrots", quantity: 1, unit: "lb", category: "produce", price: 0 },
  ],
  "meat basics": [
    { item: "Chicken Breast", quantity: 2, unit: "lb", category: "meat", price: 0 },
    { item: "Ground Beef", quantity: 1, unit: "lb", category: "meat", price: 0 },
  ],
  "baking essentials": [
    { item: "Flour", quantity: 5, unit: "lb", category: "pantry", price: 0 },
    { item: "Sugar", quantity: 2, unit: "lb", category: "pantry", price: 0 },
    { item: "Baking Powder", quantity: 1, unit: "count", category: "pantry", price: 0 },
    { item: "Baking Soda", quantity: 1, unit: "count", category: "pantry", price: 0 },
    { item: "Vanilla Extract", quantity: 1, unit: "count", category: "pantry", price: 0 },
  ],
};

export async function POST(req: Request) {
  try {
    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing userInput" },
        { status: 400 }
      );
    }

    const input = userInput.toLowerCase().trim();

    // Check for template matches
    for (const [templateKey, templateItems] of Object.entries(TEMPLATES)) {
      if (input.includes(templateKey)) {
        console.log(`🎯 Matched template: ${templateKey}`);
        return NextResponse.json({ items: templateItems });
      }
    }

    // Otherwise, use OpenAI to parse natural language
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL_ID || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a kitchen inventory assistant. Parse user input and extract food items.

Return ONLY valid JSON array with this structure:
[{"item":"Milk","quantity":1,"unit":"gal","category":"dairy","price":0}]

Rules:
- Extract ALL items mentioned
- Infer reasonable quantities if not specified (default: 1)
- Choose appropriate unit: count, oz, lb, g, kg, ml, l, gal, cup, tbsp, tsp
- Categorize items: produce, dairy, meat, bakery, pantry, frozen, condiments
- Default price to 0
- Return ONLY the JSON array, no markdown, no explanations`
          },
          {
            role: "user",
            content: userInput
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`OpenAI API error ${apiRes.status}: ${errText}`);
    }

    const apiJson = await apiRes.json();
    let raw = apiJson.choices?.[0]?.message?.content ?? "[]";

    // Strip code fences if present
    let rawContent = raw.trim();
    if (rawContent.startsWith("```")) {
      rawContent = rawContent.replace(/^```(?:json)?\s*/, '').replace(/```$/,'').trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      parsed = [];
    }

    const items = Array.isArray(parsed) ? parsed : [];

    console.log("🤖 AI parsed items:", items);

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("🚨 AI add items error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
