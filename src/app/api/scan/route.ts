/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
// (removed OpenAI SDK import)

export const runtime = "nodejs";
import { Buffer } from "buffer";
import heicConvert from "heic-convert";

// (removed OpenAI client instantiation)

export async function POST(req: Request) {
  const { imageUrl } = await req.json();    // base-64 string

  // Detect HEIC/HEIF data‑URLs and convert to JPEG
  const [meta, base64] = imageUrl.split(",");
  const mimeMatch = /^data:(.*);base64$/.exec(meta);
  const mime = mimeMatch?.[1] ?? "";

  let jpegDataUrl = imageUrl; // default

  if (mime === "image/heic" || mime === "image/heif") {
    const buf = Buffer.from(base64, "base64");
    // Convert Node.js Buffer to ArrayBuffer for heic-convert
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const jpegArrayBuffer = await heicConvert({
      buffer: arrayBuffer,
      format: "JPEG",
      quality: 0.85,
    });
    // Convert back to Node.js Buffer to base64-encode
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

  const apiJson = await apiRes.json();
  const raw = apiJson.choices?.[0]?.message?.content ?? "[]";
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