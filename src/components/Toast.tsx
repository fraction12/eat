"use client"

import { useEffect, useState } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

type Toast = {
  id: string
  type: "success" | "error" | "info"
  message: string
}

let toastId = 0
const toastListeners = new Set<(toast: Toast) => void>()

export function showToast(type: Toast["type"], message: string) {
  const toast: Toast = {
    id: `toast-${++toastId}`,
    type,
    message,
  }
  toastListeners.forEach((listener) => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 4000)
    }

    toastListeners.add(listener)
    return () => {
      toastListeners.delete(listener)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200"
              : toast.type === "error"
              ? "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : toast.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`flex-1 text-sm font-medium ${
              toast.type === "success"
                ? "text-green-900"
                : toast.type === "error"
                ? "text-red-900"
                : "text-blue-900"
            }`}
          >
            {toast.message}
          </p>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
