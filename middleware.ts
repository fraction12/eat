
// middleware.ts  (project root)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  // Create a Supabase client tied to this request/response
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect unauthenticated users to /auth/signin (except when already on /auth)
  if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  return res
}

// Match every route except static assets and the auth pages
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}