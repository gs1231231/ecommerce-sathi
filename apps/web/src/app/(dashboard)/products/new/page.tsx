"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://65.1.110.181/api";

interface Variant {
  title: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  inventoryQuantity: string;
  hsnCode: string;
  gstRate: string;
  weight: string;
}

const emptyVariant: Variant = {
  title: "Default",
  sku: "",
  price: "",
  compareAtPrice: "",
  inventoryQuantity: "0",
  hsnCode: "",
  gstRate: "18",
  weight: "",
};

export default function NewProductPage(): React.ReactElement {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "draft",
    productType: "physical",
    vendor: "",
    tags: "",
  });
  const [variants, setVariants] = useState<Variant[]>([{ ...emptyVariant }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function addVariant(): void {
    setVariants((v) => [...v, { ...emptyVariant, title: `Variant ${v.length + 1}` }]);
  }

  function updateVariant(index: number, field: keyof Variant, value: string): void {
    setVariants((v) =>
      v.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function removeVariant(index: number): void {
    if (variants.length > 1) {
      setVariants((v) => v.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setError("Please login first");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
          variants: variants.map((v) => ({
            title: v.title,
            sku: v.sku || undefined,
            price: parseFloat(v.price) || 0,
            compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : undefined,
            inventoryQuantity: parseInt(v.inventoryQuantity) || 0,
            hsnCode: v.hsnCode || undefined,
            gstRate: v.gstRate ? parseFloat(v.gstRate) : undefined,
            weight: v.weight ? parseFloat(v.weight) : undefined,
            weightUnit: "g",
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to create product");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold">Product Created!</h1>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/products" className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
            View Products
          </Link>
          <button onClick={() => { setSuccess(false); setForm({ title: "", description: "", status: "draft", productType: "physical", vendor: "", tags: "" }); setVariants([{ ...emptyVariant }]); }} className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/products" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; Products</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Add Product</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Premium Leather Bag" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Describe your product..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.productType} onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none">
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                  <option value="service">Service</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input type="text" value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Brand name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input type="text" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="leather, bags, handmade" />
              </div>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Variants & Pricing</h2>
            <button type="button" onClick={addVariant} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">+ Add Variant</button>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">Variant {i + 1}</span>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(i)} className="text-sm text-red-500 hover:text-red-700">Remove</button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Title</label>
                  <input type="text" value={v.title} onChange={(e) => updateVariant(i, "title", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">SKU</label>
                  <input type="text" value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                  <input type="number" required min="0" step="0.01" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Compare Price</label>
                  <input type="number" min="0" step="0.01" value={v.compareAtPrice} onChange={(e) => updateVariant(i, "compareAtPrice", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Inventory</label>
                  <input type="number" min="0" value={v.inventoryQuantity} onChange={(e) => updateVariant(i, "inventoryQuantity", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">HSN Code</label>
                  <input type="text" value={v.hsnCode} onChange={(e) => updateVariant(i, "hsnCode", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="42022210" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">GST %</label>
                  <select value={v.gstRate} onChange={(e) => updateVariant(i, "gstRate", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none">
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Weight (g)</label>
                  <input type="number" min="0" value={v.weight} onChange={(e) => updateVariant(i, "weight", e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? "Creating..." : "Create Product"}
          </button>
          <Link href="/products" className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
