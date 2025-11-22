"use client"

import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, AlertCircle, X, Rss } from "lucide-react"
import { showToast } from "@/components/Toast"

type Feed = {
  id: string
  feed_url: string
  feed_name: string
  feed_description: string | null
  created_at: string
}

type ManageFeedsModalProps = {
  isOpen: boolean
  onClose: () => void
  feeds: Feed[]
  onDeleteFeed: (feedId: string) => void
  feedWarnings: Record<string, string>
}

export function ManageFeedsModal({
  isOpen,
  onClose,
  feeds,
  onDeleteFeed,
  feedWarnings,
}: ManageFeedsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Rss className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage RSS Feeds</h2>
              <p className="text-sm text-gray-600 mt-1">
                {feeds.length} feed{feeds.length !== 1 ? 's' : ''} active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Feed List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {feeds.length === 0 ? (
            <div className="text-center py-12">
              <Rss className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No feeds added yet</p>
              <p className="text-gray-400 text-sm mt-2">Click "Add Feed" to get started</p>
            </div>
          ) : (
            feeds.map((feed) => (
              <div
                key={feed.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg">{feed.feed_name}</h3>
                    {feed.feed_description && (
                      <p className="text-sm text-gray-600 mt-1">{feed.feed_description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={feed.feed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate max-w-md"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{feed.feed_url}</span>
                      </a>
                    </div>

                    {/* Warning if feed has issues */}
                    {feedWarnings[feed.id] && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-yellow-900">Feed Issue</p>
                          <p className="text-xs text-yellow-700 mt-0.5">{feedWarnings[feed.id]}</p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(feed.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteFeed(feed.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0"
                    title={`Remove ${feed.feed_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
