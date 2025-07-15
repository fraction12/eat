/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import OpenAI from "openai";

import heicConvert from "heic-convert";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  const { imageUrl } = await req.json();    // base-64 string

  // Detect HEIC/HEIF data‑URLs and convert to JPEG
  const [meta, base64] = imageUrl.split(",");
  const mimeMatch = /^data:(.*);base64$/.exec(meta);
  const mime = mimeMatch?.[1] ?? "";

  let jpegDataUrl = imageUrl; // default

  if (mime === "image/heic" || mime === "image/heif") {
    const buf = Buffer.from(base64, "base64");
    const jpegBuf = await heicConvert({
      buffer: buf,
      format: "JPEG",
      quality: 0.85,
    }) as unknown as Buffer;
    jpegDataUrl = `data:image/jpeg;base64,${jpegBuf.toString("base64")}`;
  }

  const gpt = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_ID || "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return ONLY valid JSON — no markdown, no explanations."
      },
      {
        role: "user",
        content: [
          { type: "text",
            text: "This is a grocery receipt. Extract every line‑item with its price and return an array of objects with keys `item` and `price`, like:\n[{\"item\":\"Milk\",\"price\":2.99},{\"item\":\"Eggs\",\"price\":3.50}]" },
          { type: "image_url", image_url: { url: jpegDataUrl } }
        ]
      }
    ]
  });

  const raw = gpt.choices[0].message.content ?? "[]";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }

  // Accept either direct array or wrapped `{ items: [...] }`
  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.items)
      ? parsed.items
      : [];

  return NextResponse.json(items); // always an array
}