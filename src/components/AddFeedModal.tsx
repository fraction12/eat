"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, Rss } from "lucide-react"
import { showToast } from "@/components/Toast"

type AddFeedModalProps = {
  isOpen: boolean
  onClose: () => void
  onFeedAdded: () => void
}

export function AddFeedModal({ isOpen, onClose, onFeedAdded }: AddFeedModalProps) {
  const [feedUrl, setFeedUrl] = useState("")
  const [feedName, setFeedName] = useState("")
  const [feedDescription, setFeedDescription] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  if (!isOpen) return null

  const handleAdd = async () => {
    if (!feedUrl.trim() || !feedName.trim()) {
      showToast("error", "Feed URL and Name are required")
      return
    }

    setIsAdding(true)

    try {
      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedUrl: feedUrl.trim(),
          feedName: feedName.trim(),
          feedDescription: feedDescription.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add feed")
      }

      // Clear form
      setFeedUrl("")
      setFeedName("")
      setFeedDescription("")

      // Notify parent
      onFeedAdded()
      onClose()
      showToast("success", "Feed added successfully!")
    } catch (error) {
      console.error("Error adding feed:", error)
      showToast("error", "Failed to add feed. Please check the URL and try again.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Rss className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Add Recipe Feed</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="feed-url" className="block text-sm font-medium text-gray-700 mb-2">
              Feed URL *
            </label>
            <Input
              id="feed-url"
              type="url"
              placeholder="https://example.com/feed/rss"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              disabled={isAdding}
              className="text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: https://www.bonappetit.com/feed/recipes-rss-feed/rss
            </p>
          </div>

          <div>
            <label htmlFor="feed-name" className="block text-sm font-medium text-gray-700 mb-2">
              Feed Name *
            </label>
            <Input
              id="feed-name"
              type="text"
              placeholder="e.g., Bon Appétit, Serious Eats"
              value={feedName}
              onChange={(e) => setFeedName(e.target.value)}
              disabled={isAdding}
              className="text-base"
            />
          </div>

          <div>
            <label htmlFor="feed-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <Input
              id="feed-description"
              type="text"
              placeholder="Brief description of this feed"
              value={feedDescription}
              onChange={(e) => setFeedDescription(e.target.value)}
              disabled={isAdding}
              className="text-base"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAdding}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isAdding || !feedUrl.trim() || !feedName.trim()}
            className="flex-1"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Feed"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
