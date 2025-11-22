"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, Plus, Camera, Upload, Scan } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ReactWebcam from "react-webcam"

type Item = { id: string; item: string; price: number; quantity: number; created_at: string }

export default function InventoryPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<Item[]>([])

  // Tab state: 'scan' or 'manual'
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan')

  const [showCam, setShowCam] = useState(false)
  const webcamRef = useRef<ReactWebcam>(null)

  // Manual entry state
  const [manualItem, setManualItem] = useState("")
  const [manualPrice, setManualPrice] = useState("")
  const [manualQuantity, setManualQuantity] = useState("1")
  const [isAdding, setIsAdding] = useState(false)

  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity || 1), 0)

  // Fetch current inventory
  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) setItems(data as Item[])
    }
    fetchItems()
  }, [])

  const handleDelete = async (id: string) => {
    await supabase.from("inventory").delete().eq("id", id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const fileToDataURL = (f: File) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(f)
    })

  async function runScan(imageSrc: string) {
    // 1. GPT-4 Vision -> items
    const scanRes = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: imageSrc }),
    })

    if (!scanRes.ok) {
      const errText = await scanRes.text()
      console.error("Scan route error:", scanRes.status, errText)
      alert(`Scan failed (${scanRes.status}). Check console for details.`)
      return
    }

    const itemsFromAI: { item: string; price: number }[] = await scanRes.json()

    // 2. Save to Supabase
    const saveRes = await fetch("/api/saveItems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: itemsFromAI }),
    })

    if (!saveRes.ok) {
      const errText = await saveRes.text()
      console.error("Save route error:", saveRes.status, errText)
      alert(`Save failed (${saveRes.status}). Check console for details.`)
      return
    }

    // 3. Refresh list
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })
    setItems((data ?? []) as Item[])
  }

  const handleScan = async () => {
    if (!file) return
    setIsScanning(true)
    const base64 = await fileToDataURL(file)
    await runScan(base64)
    setIsScanning(false)
    setFile(null)
  }

  const openCamera = () => setShowCam(true)

  const captureAndScan = async () => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return
    setIsScanning(true)
    await runScan(imageSrc)
    setIsScanning(false)
    setShowCam(false)
  }

  const handleManualAdd = async () => {
    if (!manualItem.trim()) {
      alert("Please enter an item name")
      return
    }

    setIsAdding(true)

    const price = manualPrice ? parseFloat(manualPrice) : 0
    const quantity = manualQuantity ? parseInt(manualQuantity) : 1

    // Save to Supabase using the same endpoint
    const saveRes = await fetch("/api/saveItems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ item: manualItem.trim(), price, quantity }] }),
    })

    if (!saveRes.ok) {
      const errText = await saveRes.text()
      console.error("Save route error:", saveRes.status, errText)
      alert(`Save failed (${saveRes.status}). Check console for details.`)
      setIsAdding(false)
      return
    }

    // Refresh list
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false })
    setItems((data ?? []) as Item[])

    // Clear form
    setManualItem("")
    setManualPrice("")
    setManualQuantity("1")
    setIsAdding(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">My Inventory</h1>
          <p className="text-gray-600">Scan receipts or add items manually to track your groceries</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Add Items */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'scan'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Scan className="inline-block mr-2 h-5 w-5" />
                  Scan Receipt
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === 'manual'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="inline-block mr-2 h-5 w-5" />
                  Add Manually
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'scan' ? (
                  <div className="space-y-4">
                    {showCam ? (
                      <>
                        <ReactWebcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          className="rounded-lg w-full"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={captureAndScan} disabled={isScanning} className="w-full">
                            {isScanning ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Scanning...
                              </>
                            ) : (
                              <>
                                <Camera className="mr-2 h-4 w-4" />
                                Capture & Scan
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={() => setShowCam(false)} className="w-full">
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          disabled={isScanning}
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                        >
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <span className="text-sm text-gray-600">
                            {file ? file.name : "Click to upload or drag and drop"}
                          </span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button onClick={handleScan} disabled={isScanning || !file} className="w-full">
                            {isScanning ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Scanning...
                              </>
                            ) : (
                              <>
                                <Scan className="mr-2 h-4 w-4" />
                                Scan Receipt
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={openCamera} className="w-full">
                            <Camera className="mr-2 h-4 w-4" />
                            Use Camera
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name *
                      </label>
                      <Input
                        id="item-name"
                        type="text"
                        placeholder="e.g., Milk, Eggs, Bread"
                        value={manualItem}
                        onChange={(e) => setManualItem(e.target.value)}
                        disabled={isAdding}
                        onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                        className="text-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="item-price" className="block text-sm font-medium text-gray-700 mb-2">
                          Price (optional)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="item-price"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={manualPrice}
                            onChange={(e) => setManualPrice(e.target.value)}
                            disabled={isAdding}
                            onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                            className="pl-8 text-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <Input
                          id="item-quantity"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={manualQuantity}
                          onChange={(e) => setManualQuantity(e.target.value)}
                          disabled={isAdding}
                          onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                          className="text-lg"
                        />
                      </div>
                    </div>
                    <Button onClick={handleManualAdd} disabled={isAdding || !manualItem.trim()} className="w-full" size="lg">
                      {isAdding ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" />
                          Add Item
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Inventory Display */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Current Items</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-3xl font-bold text-green-600">${total.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">No items yet</p>
                    <p className="text-gray-400 text-sm mt-2">Add items to get started!</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.item}</h3>
                        <p className="text-sm text-gray-500">
                          ${Number(item.price).toFixed(2)} each • Added {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border border-gray-300">
                          <button
                            onClick={async () => {
                              const newQty = Math.max(1, (item.quantity || 1) - 1)
                              await supabase.from("inventory").update({ quantity: newQty }).eq("id", item.id)
                              const { data } = await supabase.from("inventory").select("*").order("created_at", { ascending: false })
                              setItems((data ?? []) as Item[])
                            }}
                            className="text-gray-600 hover:text-gray-900 font-bold text-lg"
                          >
                            −
                          </button>
                          <span className="font-semibold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={async () => {
                              const newQty = (item.quantity || 1) + 1
                              await supabase.from("inventory").update({ quantity: newQty }).eq("id", item.id)
                              const { data } = await supabase.from("inventory").select("*").order("created_at", { ascending: false })
                              setItems((data ?? []) as Item[])
                            }}
                            className="text-gray-600 hover:text-gray-900 font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-lg font-bold text-gray-900 min-w-[4rem] text-right">
                          ${(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
