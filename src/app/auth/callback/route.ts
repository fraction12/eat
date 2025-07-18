export const dynamic = 'force-dynamic';
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({
    cookies: () => req.cookies,
    headers: () => req.headers,
  })

  // Exchange the `?code=` param in the URL for a session cookie
  await supabase.auth.exchangeCodeForSession()

  // Redirect the user to the main scan page
  return NextResponse.redirect(new URL('/scan', req.url))
}
