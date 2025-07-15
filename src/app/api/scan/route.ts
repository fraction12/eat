/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { Buffer } from "buffer";
import heicConvert from "heic-convert";

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // Detect HEIC/HEIF data-URLs and convert to JPEG
    const [meta, base64] = imageUrl.split(",");
    const mimeMatch = /^data:(.*);base64$/.exec(meta);
    const mime = mimeMatch?.[1] ?? "";

    let jpegDataUrl = imageUrl;
    if (mime === "image/heic" || mime === "image/heif") {
      const buf = Buffer.from(base64, "base64");
      // Use Node Buffer directly for conversion (Buffer is iterable)
      const jpegArrayBuffer = await heicConvert({
        buffer: buf as any,
        format: "JPEG",
        quality: 0.85,
      });
      const jpegBuf = Buffer.from(jpegArrayBuffer);
      jpegDataUrl = `data:image/jpeg;base64,${jpegBuf.toString("base64")}`;
    }

    // Call OpenAI REST API directly
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL_ID || "gpt-4o",
        messages: [
          { role: "system", content: "Return ONLY valid JSON — no markdown, no explanations." },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is a grocery receipt. Extract every line-item with its price and return an array of objects with keys `item` and `price`, like:[{\"item\":\"Milk\",\"price\":2.99},{\"item\":\"Eggs\",\"price\":3.50}]"
              },
              { type: "image_url", image_url: { url: jpegDataUrl } }
            ]
          }
        ]
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
      rawContent = rawContent.replace(/^```(?:json)?\s*/, '').replace(/```$/,'').trim();
    }
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = [];
    }

    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

    console.error("🚧 scan raw response:", raw);
    console.error("🚧 parsed items:", items);

    return NextResponse.json(items);
  } catch (err: any) {
    console.error("🚨 Scan route error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}