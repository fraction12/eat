// src/app/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/utils/supabase-server'

export default async function Home() {
  const supabase = createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the user is not signed in, send them to /auth/signin
  if (!session) {
    redirect('/auth/signin')
  }

  // Otherwise send them to the scan page
  redirect('/scan')
  return null
}