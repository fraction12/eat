"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X, MessageSquare, Star } from "lucide-react"
import { showToast } from "@/components/Toast"

type FeedbackModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [feedbackType, setFeedbackType] = useState("general")
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!message.trim()) {
      showToast("error", "Please enter your feedback")
      return
    }

    setIsSending(true)

    try {
      const response = await fetch("/api/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          rating,
          feedbackType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send feedback")
      }

      // Clear form
      setMessage("")
      setRating(null)
      setFeedbackType("general")

      onClose()
      showToast("success", "Thank you! Your feedback has been sent.")
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
      setRating(null)
      setFeedbackType("general")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Send Feedback</h2>
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
              What kind of feedback?
            </label>
            <select
              id="feedback-type"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
              disabled={isSending}
              className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement Suggestion</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Rating (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate your experience? (optional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  disabled={isSending}
                  className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-2">
              Your feedback *
            </label>
            <textarea
              id="feedback-message"
              placeholder="Tell us what's on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              We read every piece of feedback and appreciate your input!
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
            Cancel
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
              "Send Feedback"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
