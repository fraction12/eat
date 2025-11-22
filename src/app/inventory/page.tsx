"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2, Trash2, Plus, Camera, Upload, Scan, Search, ChefHat,
  Apple, Milk, Beef, Croissant, Package, Snowflake, Droplet,
  AlertCircle, Clock, ArrowRight, Filter, X, ChevronDown, ChevronUp
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

// Get appropriate step size based on unit
function getStepForUnit(unit?: string): number {
  if (!unit || unit === 'count') return 1

  switch (unit) {
    case 'oz':
    case 'g':
    case 'ml':
      return 1  // Single ounce/gram/ml increments
    case 'lb':
    case 'kg':
    case 'l':
    case 'gal':
      return 0.1  // Decimal increments for larger units
    case 'cup':
    case 'tbsp':
    case 'tsp':
      return 0.5  // Half cup/tbsp/tsp increments
    default:
      return 0.1
  }
}

export default function InventoryPage() {
  const { user } = useAuth()
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
  const [manualCategory, setManualCategory] = useState<Category>("pantry")
  const [manualUnit, setManualUnit] = useState("count")
  const [isAdding, setIsAdding] = useState(false)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all')

  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(new Set())

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
    await supabase.from("inventory").delete().eq("id", id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    showToast("success", "Item removed from inventory")
  }

  const handleCategoryChange = async (id: string, newCategory: Category) => {
    await supabase.from("inventory").update({ category: newCategory }).eq("id", id)
    await refetchItems()
    showToast("success", "Category updated")
  }

  const handleUnitChange = async (id: string, newUnit: string) => {
    await supabase.from("inventory").update({ unit: newUnit }).eq("id", id)
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
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">My Kitchen Inventory</h1>
          <p className="text-gray-600">Track what you have • Find what you can make • Never forget what you bought</p>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Total Items</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalItems}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-1">Categories</div>
            <div className="text-3xl font-bold text-gray-900">{stats.categories}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-1">Recently Added</div>
            <div className="text-3xl font-bold text-gray-900">{stats.recentItems}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 mb-1">Running Low</div>
            <div className="text-3xl font-bold text-gray-900">{stats.lowStock}</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Total Value</div>
            <div className="text-3xl font-bold text-green-600">${stats.totalValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Recipe Suggestion Widget */}
        {stats.totalItems > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl shadow-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ready to Cook?</h2>
                <p className="text-white/90">You have {stats.totalItems} ingredients. Let's find recipes you can make!</p>
              </div>
              <Link href="/recipes">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                  <ChefHat className="mr-2 h-5 w-5" />
                  Find Recipes
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
              {/* Same tabs and content as before */}
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
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="item-name" className="block text-sm font-semibold text-gray-700 mb-2">
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
                        className="h-11 text-base"
                      />
                    </div>

                    <div>
                      <label htmlFor="item-category" className="block text-sm font-semibold text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        id="item-category"
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value as Category)}
                        disabled={isAdding}
                        className="w-full h-11 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                        <label htmlFor="item-quantity" className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="h-11 text-base"
                        />
                      </div>
                      <div>
                        <label htmlFor="item-unit" className="block text-sm font-semibold text-gray-700 mb-2">
                          Unit *
                        </label>
                        <select
                          id="item-unit"
                          value={manualUnit}
                          onChange={(e) => setManualUnit(e.target.value)}
                          disabled={isAdding}
                          className="w-full h-11 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          {unitOptions.map(unit => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="item-price" className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="h-11 pl-8 text-base"
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
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as Category | 'all')}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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

                          return (
                            <div
                              key={item.id}
                              className="p-4 hover:bg-orange-50/30 hover:shadow-sm transition-all duration-150"
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900">{item.item}</h4>
                                    {isNew && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        NEW
                                      </span>
                                    )}
                                    {isLowStock && (
                                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Low
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                                    <span>${Number(item.price).toFixed(2)} each</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {daysOld === 0 ? 'Today' : daysOld === 1 ? 'Yesterday' : `${daysOld} days ago`}
                                    </span>
                                    <span>•</span>
                                    <select
                                      value={categorizeItem(item)}
                                      onChange={(e) => handleCategoryChange(item.id, e.target.value as Category)}
                                      className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                      <option value="produce">🥬 Produce</option>
                                      <option value="dairy">🥛 Dairy</option>
                                      <option value="meat">🥩 Meat</option>
                                      <option value="bakery">🍞 Bakery</option>
                                      <option value="pantry">🥫 Pantry</option>
                                      <option value="frozen">🧊 Frozen</option>
                                      <option value="condiments">🧂 Condiments</option>
                                    </select>
                                    <span>•</span>
                                    <select
                                      value={item.unit || 'count'}
                                      onChange={(e) => handleUnitChange(item.id, e.target.value)}
                                      className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                      {unitOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                  {/* Quantity Display with Unit */}
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                      <button
                                        onClick={async () => {
                                          const step = getStepForUnit(item.unit)
                                          const currentQty = Number(item.quantity || 1)
                                          const newQty = Math.max(step, Number((currentQty - step).toFixed(2)))
                                          await supabase.from("inventory").update({ quantity: newQty }).eq("id", item.id)
                                          await refetchItems()
                                        }}
                                        className="text-gray-600 hover:text-gray-900 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                      >
                                        −
                                      </button>
                                      <span className="font-bold text-gray-900 min-w-[4rem] text-center text-sm">
                                        {(!item.unit || item.unit === 'count') ? item.quantity || 1 : Number(item.quantity || 1).toFixed(1)} {item.unit || 'count'}
                                      </span>
                                      <button
                                        onClick={async () => {
                                          const step = getStepForUnit(item.unit)
                                          const currentQty = Number(item.quantity || 1)
                                          const newQty = Number((currentQty + step).toFixed(2))
                                          await supabase.from("inventory").update({ quantity: newQty }).eq("id", item.id)
                                          await refetchItems()
                                        }}
                                        className="text-gray-600 hover:text-gray-900 font-bold text-lg w-6 h-6 flex items-center justify-center"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Total Price */}
                                  <div className="text-right min-w-[4rem]">
                                    <div className="text-lg font-bold text-gray-900">
                                      ${(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}
                                    </div>
                                  </div>

                                  {/* Delete Button */}
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
