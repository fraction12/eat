export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: Request) {
   const cookieStore = await cookies(); // from 'next/headers'

  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
  })

  // Exchange the `?code=` param in the URL for a session cookie
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  await supabase.auth.exchangeCodeForSession(code)

  // Redirect the user to the main scan page
  return NextResponse.redirect(new URL('/scan', req.url))
}
