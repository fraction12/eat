"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, ArrowRight } from "lucide-react"

export function Auth() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/inventory`,
        },
      })

      if (error) throw error

      setEmailSent(true)
      setMessage("Check your email for the magic link!")
    } catch (error: any) {
      setMessage(error.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🍳 Eat AI
          </h1>
          <p className="text-gray-600">
            Sign in to track your ingredients and find recipes
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleMagicLink} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 text-lg"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                "Sending magic link..."
              ) : (
                <>
                  Send Magic Link
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Check your email!
              </h3>
              <p className="text-gray-600 mb-4">
                We sent a magic link to <br />
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Click the link in the email to sign in. <br />
                The link expires in 1 hour.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEmailSent(false)
                setEmail("")
                setMessage("")
              }}
              className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Use a different email
            </button>
          </div>
        )}

        {message && !emailSent && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes("error") || message.includes("Error")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span>No password required</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            We'll send you a secure login link. No passwords to remember! 🎉
          </p>
        </div>
      </div>
    </div>
  )
}
