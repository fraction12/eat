"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2, Trash2, Plus, Camera, Upload, Scan, Search, ChefHat,
  Apple, Milk, Beef, Croissant, Package, Snowflake, Droplet,
  AlertCircle, Clock, ArrowRight, Filter, X, ChevronDown, ChevronUp, Sparkles
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import ReactWebcam from "react-webcam"
import { ToastContainer, showToast } from "@/components/Toast"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"

type Item = {
  id: string
  item: string
  price: number
  quantity: number
  created_at: string
  category?: Category
  unit?: string
}

type Category = 'produce' | 'dairy' | 'meat' | 'bakery' | 'pantry' | 'frozen' | 'condiments'

// Common units for different types of items
const unitOptions = [
  { value: 'count', label: 'Count' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (L)' },
  { value: 'gal', label: 'Gallons (gal)' },
  { value: 'cup', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons' },
  { value: 'tsp', label: 'Teaspoons' },
]

const categoryIcons: Record<Category, any> = {
  produce: Apple,
  dairy: Milk,
  meat: Beef,
  bakery: Croissant,
  pantry: Package,
  frozen: Snowflake,
  condiments: Droplet,
}

const categoryColors: Record<Category, { ring: string, borderLeft: string, iconColor: string }> = {
  produce: { ring: 'ring-2 ring-green-400', borderLeft: 'border-l-4 border-l-green-500', iconColor: 'text-green-600' },
  dairy: { ring: 'ring-2 ring-blue-400', borderLeft: 'border-l-4 border-l-blue-500', iconColor: 'text-blue-600' },
  meat: { ring: 'ring-2 ring-red-400', borderLeft: 'border-l-4 border-l-red-500', iconColor: 'text-red-600' },
  bakery: { ring: 'ring-2 ring-amber-400', borderLeft: 'border-l-4 border-l-amber-500', iconColor: 'text-amber-600' },
  pantry: { ring: 'ring-2 ring-purple-400', borderLeft: 'border-l-4 border-l-purple-500', iconColor: 'text-purple-600' },
  frozen: { ring: 'ring-2 ring-cyan-400', borderLeft: 'border-l-4 border-l-cyan-500', iconColor: 'text-cyan-600' },
  condiments: { ring: 'ring-2 ring-orange-400', borderLeft: 'border-l-4 border-l-orange-500', iconColor: 'text-orange-600' },
}

// Categorize items based on stored category or name
function categorizeItem(item: Item | string): Category {
  // If item object with stored category, use that
  if (typeof item === 'object' && item.category) {
    return item.category
  }

  // Otherwise, auto-categorize by name
  const name = typeof item === 'string' ? item.toLowerCase() : item.item.toLowerCase()

  // Produce
  const produce = ['apple', 'banana', 'orange', 'tomato', 'lettuce', 'carrot', 'potato', 'onion', 'garlic', 'pepper', 'broccoli', 'spinach', 'cucumber', 'avocado', 'strawberry', 'grape', 'lemon', 'lime', 'berry', 'fruit', 'vegetable', 'salad', 'celery', 'mushroom', 'corn', 'peas']
  if (produce.some(keyword => name.includes(keyword))) return 'produce'

  // Dairy
  const dairy = ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'cottage', 'cheddar', 'mozzarella', 'parmesan', 'sour cream', 'whipped cream']
  if (dairy.some(keyword => name.includes(keyword))) return 'dairy'

  // Meat & Seafood
  const meat = ['chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham', 'steak', 'fish', 'salmon', 'tuna', 'shrimp', 'meat', 'ground beef', 'lamb', 'duck']
  if (meat.some(keyword => name.includes(keyword))) return 'meat'

  // Bakery
  const bakery = ['bread', 'bagel', 'muffin', 'croissant', 'donut', 'bun', 'roll', 'tortilla', 'pita', 'baguette', 'cake', 'cookie', 'pastry']
  if (bakery.some(keyword => name.includes(keyword))) return 'bakery'

  // Frozen
  const frozen = ['frozen', 'ice cream', 'popsicle', 'ice', 'pizza']
  if (frozen.some(keyword => name.includes(keyword))) return 'frozen'

  // Condiments
  const condiments = ['sauce', 'ketchup', 'mustard', 'mayo', 'dressing', 'oil', 'vinegar', 'salt', 'pepper', 'spice', 'seasoning', 'syrup', 'jam', 'jelly', 'honey', 'salsa', 'hot sauce']
  if (condiments.some(keyword => name.includes(keyword))) return 'condiments'

  // Default to pantry
  return 'pantry'
}

// Calculate days since added
function getDaysOld(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - created.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [isScanning, setIsScanning] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<Item[]>([])

  // Tab state: 'scan', 'manual', or 'ai'
  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'ai'>('scan')

  // AI chat state
  const [aiInput, setAiInput] = useState("")
  const [aiProcessing, setAiProcessing] = useState(false)

  const [showCam, setShowCam] = useState(false)
  const webcamRef = useRef<ReactWebcam>(null)

  // Manual entry state
  const [manualItem, setManualItem] = useState("")
  const [manualPrice, setManualPrice] = useState("")
  const [manualQuantity, setManualQuantity] = useState("1")
  const [manualCategory, setManualCategory] = useState<Category>("pantry")
  const [manualUnit, setManualUnit] = useState("count")
  const [isAdding, setIsAdding] = useState(false)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')

  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(new Set())

  // Local quantity state for responsive UI
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({})
  const [updatingQuantities, setUpdatingQuantities] = useState<Set<string>>(new Set())

  // Local price state for responsive UI
  const [localPrices, setLocalPrices] = useState<Record<string, number | string>>({})
  const [updatingPrices, setUpdatingPrices] = useState<Set<string>>(new Set())

  // Local item name state for responsive UI
  const [localNames, setLocalNames] = useState<Record<string, string>>({})
  const [updatingNames, setUpdatingNames] = useState<Set<string>>(new Set())

  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity || 1), 0)

  const toggleCategory = (category: Category) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // Helper function to refetch user's inventory
  const refetchItems = async () => {
    if (!user) return
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setItems((data ?? []) as Item[])
  }

  // Fetch current inventory for the logged-in user
  useEffect(() => {
    refetchItems()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!user) return

    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting item:", error)
      showToast("error", "Failed to delete item")
      return
    }

    setItems((prev) => prev.filter((i) => i.id !== id))
    showToast("success", "Item removed from inventory")
  }

  const handleCategoryChange = async (id: string, newCategory: Category) => {
    if (!user) return

    const { error } = await supabase
      .from("inventory")
      .update({ category: newCategory })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating category:", error)
      showToast("error", "Failed to update category")
      return
    }

    await refetchItems()
    showToast("success", "Category updated")
  }

  const handleUnitChange = async (id: string, newUnit: string) => {
    if (!user) return

    const { error } = await supabase
      .from("inventory")
      .update({ unit: newUnit })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating unit:", error)
      showToast("error", "Failed to update unit")
      return
    }

    await refetchItems()
    showToast("success", "Unit updated")
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
    await refetchItems()
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
      showToast("error", "Please enter an item name")
      return
    }

    setIsAdding(true)

    const price = manualPrice ? parseFloat(manualPrice) : 0
    const quantity = manualQuantity ? parseFloat(manualQuantity) : 1

    // Save to Supabase using the same endpoint
    const saveRes = await fetch("/api/saveItems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{
          item: manualItem.trim(),
          price,
          quantity,
          category: manualCategory,
          unit: manualUnit
        }]
      }),
    })

    if (!saveRes.ok) {
      const errText = await saveRes.text()
      console.error("Save route error:", saveRes.status, errText)
      showToast("error", `Save failed (${saveRes.status})`)
      setIsAdding(false)
      return
    }

    // Refresh list
    await refetchItems()

    // Clear form
    setManualItem("")
    setManualPrice("")
    setManualQuantity("1")
    setManualCategory("pantry")
    setManualUnit("count")
    setIsAdding(false)
    showToast("success", "Item added to inventory!")
  }

  const handleAIAdd = async () => {
    if (!aiInput.trim()) {
      showToast("error", "Please enter what you have")
      return
    }

    setAiProcessing(true)

    try {
      // Call AI parsing endpoint
      const parseRes = await fetch("/api/ai-add-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: aiInput.trim() }),
      })

      if (!parseRes.ok) {
        const errText = await parseRes.text()
        console.error("AI parse error:", parseRes.status, errText)
        showToast("error", `AI processing failed (${parseRes.status})`)
        setAiProcessing(false)
        return
      }

      const { items: parsedItems } = await parseRes.json()

      if (!parsedItems || parsedItems.length === 0) {
        showToast("error", "Couldn't understand the items. Try being more specific.")
        setAiProcessing(false)
        return
      }

      // Save items to database
      const saveRes = await fetch("/api/saveItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems }),
      })

      if (!saveRes.ok) {
        const errText = await saveRes.text()
        console.error("Save route error:", saveRes.status, errText)
        showToast("error", `Save failed (${saveRes.status})`)
        setAiProcessing(false)
        return
      }

      // Refresh list
      await refetchItems()

      // Clear input
      setAiInput("")
      setAiProcessing(false)
      showToast("success", `Added ${parsedItems.length} item${parsedItems.length > 1 ? 's' : ''} to inventory!`)
    } catch (error) {
      console.error("AI add error:", error)
      showToast("error", "Something went wrong. Please try again.")
      setAiProcessing(false)
    }
  }

  // Filter and search items
  const filteredItems = items.filter(item => {
    // Search filter
    if (searchQuery && !item.item.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    // Category filter
    if (filterCategory !== 'all' && categorizeItem(item) !== filterCategory) {
      return false
    }
    return true
  })

  // Group items by category
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const category = categorizeItem(item)
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<Category, Item[]>)

  // Calculate stats
  const stats = {
    totalItems: items.length,
    totalValue: total,
    recentItems: items.filter(item => getDaysOld(item.created_at) <= 2).length,
    lowStock: items.filter(item => item.quantity <= 2).length,
    categories: Object.keys(itemsByCategory).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">My Kitchen Inventory</h1>
          <p className="text-sm sm:text-base text-gray-600">
            <span className="hidden sm:inline">Track what you have • Find what you can make • Never forget what you bought</span>
            <span className="sm:hidden">Track, find, and cook with what you have</span>
          </p>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Total Items</div>
            <div className="text-xl font-bold text-gray-900">{stats.totalItems}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Categories</div>
            <div className="text-xl font-bold text-gray-900">{stats.categories}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-1">Recently Added</div>
            <div className="text-xl font-bold text-gray-900">{stats.recentItems}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 mb-1">Running Low</div>
            <div className="text-xl font-bold text-gray-900">{stats.lowStock}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Total Value</div>
            <div className="text-xl font-bold text-green-600">${stats.totalValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Recipe Suggestion Widget */}
        {stats.totalItems > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl shadow-xl p-5 sm:p-6 mb-6 sm:mb-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Ready to Cook?</h2>
                <p className="text-sm sm:text-base text-white/90">You have {stats.totalItems} ingredient{stats.totalItems !== 1 ? 's' : ''}. Let's find recipes!</p>
              </div>
              <Link href="/recipes" className="shrink-0">
                <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100">
                  <ChefHat className="mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">Find Recipes</span>
                  <span className="sm:hidden">Find</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
          {/* Left: Add Items */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-4">
              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`flex-1 px-4 py-4 font-semibold transition-colors text-sm ${
                    activeTab === 'scan'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Scan className="inline-block mr-1 h-4 w-4" />
                  Scan
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 px-4 py-4 font-semibold transition-colors text-sm ${
                    activeTab === 'manual'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Plus className="inline-block mr-1 h-4 w-4" />
                  Manual
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 px-4 py-4 font-semibold transition-colors text-sm ${
                    activeTab === 'ai'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Sparkles className="inline-block mr-1 h-4 w-4" />
                  AI Chat
                </button>
              </div>

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
                ) : activeTab === 'manual' ? (
                  <div className="space-y-5">
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
                        className="h-10 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="item-category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        id="item-category"
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value as Category)}
                        disabled={isAdding}
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      >
                        <option value="produce">🥬 Produce</option>
                        <option value="dairy">🥛 Dairy</option>
                        <option value="meat">🥩 Meat</option>
                        <option value="bakery">🍞 Bakery</option>
                        <option value="pantry">🥫 Pantry</option>
                        <option value="frozen">🧊 Frozen</option>
                        <option value="condiments">🧂 Condiments</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <Input
                          id="item-quantity"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="1"
                          value={manualQuantity}
                          onChange={(e) => setManualQuantity(e.target.value)}
                          disabled={isAdding}
                          onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                          className="h-10 text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="item-unit" className="block text-sm font-medium text-gray-700 mb-2">
                          Unit *
                        </label>
                        <select
                          id="item-unit"
                          value={manualUnit}
                          onChange={(e) => setManualUnit(e.target.value)}
                          disabled={isAdding}
                          className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        >
                          {unitOptions.map(unit => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="item-price" className="block text-sm font-medium text-gray-700 mb-2">
                        Price (optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                        <Input
                          id="item-price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(e.target.value)}
                          disabled={isAdding}
                          onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                          className="h-10 pl-8 text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleManualAdd}
                      disabled={isAdding || !manualItem.trim()}
                      className="w-full h-12 text-base font-semibold"
                      size="lg"
                    >
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
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-3">
                      <h3 className="font-semibold text-purple-900 mb-1 flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4" />
                        Tell me what you have
                      </h3>
                      <p className="text-xs text-purple-700">
                        Try: "Add pantry staples" or "I have milk, eggs, and bread"
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Type what's in your kitchen..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !aiProcessing && aiInput.trim() && handleAIAdd()}
                        disabled={aiProcessing}
                        className="h-12 text-sm"
                      />

                      <Button
                        onClick={handleAIAdd}
                        disabled={aiProcessing || !aiInput.trim()}
                        className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700"
                        size="lg"
                      >
                        {aiProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Add Items
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Inventory Display */}
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-10 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
                    className="h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  >
                    <option value="all">All Categories</option>
                    <option value="produce">🥬 Produce</option>
                    <option value="dairy">🥛 Dairy</option>
                    <option value="meat">🥩 Meat</option>
                    <option value="bakery">🍞 Bakery</option>
                    <option value="pantry">🥫 Pantry</option>
                    <option value="frozen">🧊 Frozen</option>
                    <option value="condiments">🧂 Condiments</option>
                  </select>
                  {(searchQuery || filterCategory !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                        setFilterCategory('all')
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory Items by Category */}
            <div className="space-y-6">
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {items.length === 0 ? "No items yet" : "No items match your search"}
                  </h3>
                  <p className="text-gray-400">
                    {items.length === 0 ? "Scan a receipt or add items manually to get started!" : "Try a different search term"}
                  </p>
                </div>
              ) : (
                Object.entries(itemsByCategory).map(([category, categoryItems]) => {
                  const Icon = categoryIcons[category as Category]
                  const colors = categoryColors[category as Category]
                  const isCollapsed = collapsedCategories.has(category as Category)

                  return (
                    <div key={category} className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${colors.ring}`}>
                      {/* Category Header - Clickable */}
                      <button
                        onClick={() => toggleCategory(category as Category)}
                        className={`w-full px-6 py-4 bg-white ${colors.borderLeft} hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex items-center justify-between pr-6">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-6 w-6 ${colors.iconColor}`} />
                            <h3 className="text-lg font-bold text-gray-800 capitalize">{category}</h3>
                            <span className={`text-xs font-bold ${colors.iconColor} bg-gray-50 px-2.5 py-1 rounded-full`}>
                              {categoryItems.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-center w-8">
                            {isCollapsed ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Items - Collapsible */}
                      {!isCollapsed && (
                        <div className="divide-y divide-gray-100">
                        {categoryItems.map((item) => {
                          const daysOld = getDaysOld(item.created_at)
                          const isNew = daysOld <= 2
                          const isLowStock = item.quantity <= 2
                          const currentQty = localQuantities[item.id] !== undefined ? localQuantities[item.id] : item.quantity ?? 1
                          const currentPrice = localPrices[item.id] !== undefined ? localPrices[item.id] : item.price
                          const totalPrice = Number(currentPrice) * Number(currentQty)
                          const currentName = localNames[item.id] !== undefined ? localNames[item.id] : item.item

                          return (
                            <div
                              key={item.id}
                              className="p-5 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-transparent transition-all duration-200"
                            >
                              {/* Grid Layout: Info Left | Controls Right */}
                              <div className="grid grid-cols-[1fr,auto] gap-4 items-center">

                                {/* LEFT: Item Information */}
                                <div className="space-y-2">
                                  {/* Item Name + Badges */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Input
                                      type="text"
                                      value={currentName}
                                      onChange={(e) => {
                                        setLocalNames(prev => ({ ...prev, [item.id]: e.target.value }))
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      onBlur={async (e) => {
                                        if (!user) return

                                        const newName = e.target.value.trim()

                                        // Validate non-empty
                                        if (!newName) {
                                          showToast("error", "Item name cannot be empty")
                                          setLocalNames(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                          return
                                        }

                                        const originalName = item.item

                                        if (newName === originalName) {
                                          setLocalNames(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                          return
                                        }

                                        setUpdatingNames(prev => new Set(prev).add(item.id))

                                        const { error } = await supabase
                                          .from("inventory")
                                          .update({ item: newName })
                                          .eq("id", item.id)
                                          .eq("user_id", user.id)

                                        setUpdatingNames(prev => {
                                          const updated = new Set(prev)
                                          updated.delete(item.id)
                                          return updated
                                        })

                                        if (error) {
                                          console.error("Error updating item name:", error)
                                          showToast("error", `Failed to update name: ${error.message}`)
                                          setLocalNames(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                        } else {
                                          setLocalNames(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                          await refetchItems()
                                          showToast("success", "Item name updated")
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur()
                                        }
                                        if (e.key === 'Escape') {
                                          setLocalNames(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                          e.currentTarget.blur()
                                        }
                                      }}
                                      disabled={updatingNames.has(item.id)}
                                      className={`font-semibold text-gray-900 text-base h-auto px-2 py-1 border border-transparent hover:border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                        updatingNames.has(item.id) ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-transparent hover:bg-gray-50'
                                      }`}
                                      title="Edit item name"
                                    />
                                    {isNew && (
                                      <span className="inline-flex items-center h-5 px-2 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                                        NEW
                                      </span>
                                    )}
                                    {isLowStock && (
                                      <span className="inline-flex items-center h-5 px-2 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Low
                                      </span>
                                    )}
                                  </div>

                                  {/* Metadata Row */}
                                  <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-normal text-gray-900">
                                        {currentQty} {item.unit || 'count'}
                                      </span>
                                    </div>
                                    <div className="text-gray-400">•</div>
                                    <div className="relative inline-flex items-center">
                                      <span className="text-gray-600 mr-0.5">$</span>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={localPrices[item.id] !== undefined ? localPrices[item.id] : totalPrice.toFixed(2)}
                                        onChange={(e) => {
                                          const value = e.target.value
                                          if (value === '') {
                                            setLocalPrices(prev => ({ ...prev, [item.id]: '' }))
                                            return
                                          }
                                          const numValue = parseFloat(value)
                                          if (!isNaN(numValue) && numValue >= 0) {
                                            setLocalPrices(prev => ({ ...prev, [item.id]: numValue }))
                                          }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        onBlur={async (e) => {
                                          if (!user) return

                                          let newTotal = parseFloat(e.target.value)
                                          if (isNaN(newTotal) || newTotal < 0) {
                                            newTotal = 0
                                          }

                                          newTotal = Math.round(newTotal * 100) / 100
                                          const originalTotal = totalPrice

                                          if (newTotal === originalTotal) {
                                            setLocalPrices(prev => {
                                              const updated = { ...prev }
                                              delete updated[item.id]
                                              return updated
                                            })
                                            return
                                          }

                                          setUpdatingPrices(prev => new Set(prev).add(item.id))

                                          // Calculate new unit price from total
                                          const newUnitPrice = currentQty > 0 ? newTotal / currentQty : 0

                                          const { error } = await supabase
                                            .from("inventory")
                                            .update({ price: newUnitPrice })
                                            .eq("id", item.id)
                                            .eq("user_id", user.id)

                                          setUpdatingPrices(prev => {
                                            const updated = new Set(prev)
                                            updated.delete(item.id)
                                            return updated
                                          })

                                          if (error) {
                                            console.error("Error updating price:", error)
                                            showToast("error", `Failed to update price: ${error.message}`)
                                            setLocalPrices(prev => {
                                              const updated = { ...prev }
                                              delete updated[item.id]
                                              return updated
                                            })
                                          } else {
                                            setLocalPrices(prev => {
                                              const updated = { ...prev }
                                              delete updated[item.id]
                                              return updated
                                            })
                                            await refetchItems()
                                            showToast("success", "Price updated")
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                            e.preventDefault()
                                          }
                                          if (e.key === 'Enter') {
                                            e.currentTarget.blur()
                                          }
                                          if ((e.key === 'Delete' || e.key === 'Backspace') &&
                                              e.currentTarget.selectionStart === 0 &&
                                              e.currentTarget.selectionEnd === e.currentTarget.value.length) {
                                            e.preventDefault()
                                            setLocalPrices(prev => ({ ...prev, [item.id]: '' }))
                                          }
                                        }}
                                        disabled={updatingPrices.has(item.id)}
                                        className={`w-24 h-8 px-2 text-sm font-normal text-center border border-gray-300 hover:border-gray-400 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                          updatingPrices.has(item.id) ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white'
                                        }`}
                                        title="Edit total price"
                                      />
                                      <span className="ml-1 text-gray-600">total</span>
                                    </div>
                                    <div className="text-gray-400">•</div>
                                    <div className="inline-flex items-center gap-1.5">
                                      <Clock className="h-4 w-4 text-gray-400" />
                                      <span>{daysOld === 0 ? 'Today' : daysOld === 1 ? 'Yesterday' : `${daysOld}d ago`}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* RIGHT: Controls */}
                                <div className="flex items-center gap-2">
                                  {/* Category Dropdown */}
                                  <select
                                    value={categorizeItem(item)}
                                    onChange={(e) => handleCategoryChange(item.id, e.target.value as Category)}
                                    className="h-8 px-3 text-sm border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors cursor-pointer"
                                    title="Change category"
                                  >
                                    <option value="produce">🥬 Produce</option>
                                    <option value="dairy">🥛 Dairy</option>
                                    <option value="meat">🥩 Meat</option>
                                    <option value="bakery">🍞 Bakery</option>
                                    <option value="pantry">🥫 Pantry</option>
                                    <option value="frozen">🧊 Frozen</option>
                                    <option value="condiments">🧂 Condiments</option>
                                  </select>

                                  {/* Unit Dropdown */}
                                  <select
                                    value={item.unit || 'count'}
                                    onChange={(e) => handleUnitChange(item.id, e.target.value)}
                                    className="h-8 px-3 text-sm border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors cursor-pointer"
                                    title="Change unit"
                                  >
                                    {unitOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>

                                  {/* Quantity Input */}
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      placeholder="0.01"
                                      value={localQuantities[item.id] !== undefined ? localQuantities[item.id] : item.quantity ?? 1}
                                      onChange={(e) => {
                                        const value = e.target.value
                                        if (value === '') {
                                          setLocalQuantities(prev => ({ ...prev, [item.id]: '' as any }))
                                          return
                                        }
                                        const numValue = parseFloat(value)
                                        if (!isNaN(numValue)) {
                                          setLocalQuantities(prev => ({ ...prev, [item.id]: numValue }))
                                        }
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      onBlur={async (e) => {
                                        if (!user) return

                                        let newQty = parseFloat(e.target.value)
                                        if (isNaN(newQty) || newQty <= 0) {
                                          newQty = 0.01
                                        }

                                        newQty = Math.round(newQty * 100) / 100
                                        const originalQty = item.quantity ?? 1

                                        if (newQty === originalQty) {
                                          setLocalQuantities(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                          return
                                        }

                                        setUpdatingQuantities(prev => new Set(prev).add(item.id))

                                        const { error } = await supabase
                                          .from("inventory")
                                          .update({ quantity: newQty })
                                          .eq("id", item.id)
                                          .eq("user_id", user.id)

                                        setUpdatingQuantities(prev => {
                                          const updated = new Set(prev)
                                          updated.delete(item.id)
                                          return updated
                                        })

                                        if (error) {
                                          console.error("Error updating quantity:", error)
                                          showToast("error", `Failed to update quantity: ${error.message}`)
                                          setLocalQuantities(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                        } else {
                                          setLocalQuantities(prev => {
                                            const updated = { ...prev }
                                            delete updated[item.id]
                                            return updated
                                          })
                                          await refetchItems()
                                          showToast("success", "Quantity updated")
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                          e.preventDefault()
                                        }
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur()
                                        }
                                        if ((e.key === 'Delete' || e.key === 'Backspace') &&
                                            e.currentTarget.selectionStart === 0 &&
                                            e.currentTarget.selectionEnd === e.currentTarget.value.length) {
                                          e.preventDefault()
                                          setLocalQuantities(prev => ({ ...prev, [item.id]: '' as any }))
                                        }
                                      }}
                                      disabled={updatingQuantities.has(item.id)}
                                      className={`w-20 h-8 px-2 text-sm text-center border border-gray-300 hover:border-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                        updatingQuantities.has(item.id) ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'bg-white'
                                      }`}
                                      title="Edit quantity"
                                    />
                                  </div>

                                  {/* Delete Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
