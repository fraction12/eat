// src/utils/supabase-server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  return createServerComponentClient({
    cookies,
  })
}