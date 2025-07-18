"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase-browser"
import Link from "next/link"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
  setIsLoading(true);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // 🔑 this makes the magic link land on /auth/callback
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    setMessage(`Error: ${error.message}`);
  } else {
    setMessage('Check your email for the login link.');
  }

  setIsLoading(false);
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center mb-4">Sign In</h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full p-2 border rounded"
          />

          <button
            onClick={handleLogin}
            disabled={isLoading || !email}
            className="w-full p-2 bg-blue-600 text-white rounded"
          >
            {isLoading ? "Sending..." : "Send Sign-In Link"}
          </button>

          {message && (
            <div
              className={
                message.startsWith("Error")
                  ? "border-red-200 bg-red-50 p-3 rounded"
                  : "border-green-200 bg-green-50 p-3 rounded"
              }
            >
              <p className={message.startsWith("Error") ? "text-red-700" : "text-green-700"}>
                {message}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
