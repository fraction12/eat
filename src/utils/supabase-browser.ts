'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Instantiate the Supabase client with public env variables
export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
})