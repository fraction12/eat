/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
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

  try {
    const { items } = await req.json(); // [{ item, price, quantity? }]

    // Process each item
    for (const newItem of items) {
      const itemName = newItem.item.trim();
      const price = newItem.price || 0;
      const quantity = newItem.quantity || 1;
      const category = newItem.category || null;
      const unit = newItem.unit || 'count';

      // Check if item already exists (case-insensitive)
      const { data: existingItems, error: fetchError } = await supabase
        .from("inventory")
        .select("*")
        .ilike("item", itemName);

      if (fetchError) {
        console.error("Error fetching existing item:", fetchError);
        return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
      }

      if (existingItems && existingItems.length > 0) {
        // Item exists - update quantity
        const existingItem = existingItems[0];
        const newQuantity = (existingItem.quantity || 1) + quantity;

        const { error: updateError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id);

        if (updateError) {
          console.error("Error updating item quantity:", updateError);
          return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
        }
      } else {
        // Item doesn't exist - insert new
        const { error: insertError } = await supabase
          .from("inventory")
          .insert({ item: itemName, price, quantity, category, unit });

        if (insertError) {
          console.error("Error inserting new item:", insertError);
          return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error in saveItems:", err);
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 });
  }
}