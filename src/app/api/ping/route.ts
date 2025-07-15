import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// browser-safe (anon) keys
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // try to read a single row from the inventory table
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .limit(1);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sample: data });
}