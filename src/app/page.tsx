// src/app/page.tsx
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'

export default async function Home() {
  // Always redirect to inventory - AuthProvider will show Auth.tsx if not logged in
  redirect('/inventory')
  return null
}