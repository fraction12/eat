"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { showToast } from "@/components/Toast"

type FeedbackModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState("")
  const [feedbackType, setFeedbackType] = useState("broken")
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!message.trim()) {
      showToast("error", "Please tell me what's wrong")
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          feedbackType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send feedback")
      }

      // Clear form
      setMessage("")
      setFeedbackType("broken")

      onClose()
      showToast("success", "Got it! I'll look into this ASAP 👍")
    } catch (error) {
      console.error("Error sending feedback:", error)
      showToast("error", "Failed to send feedback. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (!isSending) {
      setMessage("")
      setFeedbackType("broken")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">What's wrong?</h2>
            <p className="text-sm text-gray-500 mt-1">Found a bug? Something confusing? Let me know!</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Feedback Type */}
          <div>
            <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 mb-2">
              What's the issue?
            </label>
            <select
              id="feedback-type"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              disabled={isSending}
              className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="broken">Something's broken</option>
              <option value="confusing">Something's confusing</option>
              <option value="missing">Missing a feature</option>
              <option value="slow">Something's slow</option>
              <option value="idea">I have an idea</option>
              <option value="other">Something else</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
              Tell me more *
            </label>
            <textarea
              id="feedback-message"
              placeholder="What happened? What were you trying to do? Be as specific as possible..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              I read everything personally. Your email is included automatically so I can follow up if needed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
            className="flex-1"
          >
            Nevermind
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSending || !message.trim()}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send to Dushyant"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
