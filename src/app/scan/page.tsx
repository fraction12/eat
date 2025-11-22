// Redirect /scan to /inventory
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation'

export default function ScanPage() {
  redirect('/inventory')
  return null
}
