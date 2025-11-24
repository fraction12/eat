
// middleware.ts  (project root)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // Create a response object
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create a Supabase client tied to this request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect unauthenticated users to / (except when already on / or /auth)
  if (!session && !req.nextUrl.pathname.startsWith('/auth') && req.nextUrl.pathname !== '/') {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return res
}

// Match every route except static assets and the auth pages
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}