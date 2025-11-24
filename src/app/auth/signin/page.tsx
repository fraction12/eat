"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to root - AuthProvider will show the new Auth.tsx landing page
    router.push('/')
  }, [router])

  return null
}
