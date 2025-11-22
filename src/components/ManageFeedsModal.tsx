"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, AlertCircle } from "lucide-react"

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage RSS Feeds</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            View and manage your {feeds.length} recipe feed{feeds.length !== 1 ? 's' : ''}
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {feeds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No feeds added yet</p>
            </div>
          ) : (
            feeds.map((feed) => (
              <div
                key={feed.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
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
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{feed.feed_url}</span>
                      </a>
                    </div>

                    {/* Warning if feed has issues */}
                    {feedWarnings[feed.id] && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-2 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700">{feedWarnings[feed.id]}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(feed.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${feed.feed_name}"?`)) {
                        onDeleteFeed(feed.id)
                      }
                    }}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
