"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ReactWebcam from "react-webcam"

type Item = { id: string; item: string; price: number; created_at: string }

export default function ScanReceiptPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [items, setItems] = useState<Item[]>([])

  const [showCam, setShowCam] = useState(false)
  const webcamRef = useRef<ReactWebcam>(null)

  const total = items.reduce((sum, i) => sum + Number(i.price), 0)

  // fetch current inventory
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
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(f);
    });

  async function runScan(imageSrc: string) {
    // 1. GPT‑4 Vision -> items
    const scanRes = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: imageSrc }),
    });

    if (!scanRes.ok) {
      const errText = await scanRes.text();
      console.error("Scan route error:", scanRes.status, errText);
      alert(`Scan failed (${scanRes.status}). Check console for details.`);
      return;
    }

    const itemsFromAI: { item: string; price: number }[] = await scanRes.json();

    // 2. save to Supabase
    const saveRes = await fetch("/api/saveItems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: itemsFromAI }),
    });

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error("Save route error:", saveRes.status, errText);
      alert(`Save failed (${saveRes.status}). Check console for details.`);
      return;
    }

    // 3. refresh list
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Item[]);
  }

  const handleScan = async () => {
    if (!file) return;
    setIsScanning(true);
    const base64 = await fileToDataURL(file);   // no HEIC check needed
    await runScan(base64);
    setIsScanning(false);
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Upload + Scan */}
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-center mb-6">Scan Receipt</h1>
            <div className="space-y-4">
              {showCam ? (
                <>
                  <ReactWebcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-lg w-full"
                  />
                  <Button onClick={captureAndScan} className="w-full" disabled={isScanning}>
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      "Capture & Scan"
                    )}
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCam(false)} className="w-full">
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={isScanning}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Button onClick={handleScan} disabled={isScanning || !file} className="w-full">
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      "Scan"
                    )}
                  </Button>
                  <Button variant="outline" onClick={openCamera} className="w-full">
                    Use webcam
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inventory table */}
        <div>
          <h2 className="text-3xl font-bold text-center mb-6">Inventory</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0 md:static">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date Added</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">{item.item}</td>
                      <td className="px-4 py-3">${Number(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="px-4 py-3 font-bold">Total</td>
                    <td className="px-4 py-3 font-bold">${total.toFixed(2)}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
