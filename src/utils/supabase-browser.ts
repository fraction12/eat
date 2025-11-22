'use client'

import { createBrowserClient } from '@supabase/ssr'

// Instantiate the Supabase client with public env variables
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)