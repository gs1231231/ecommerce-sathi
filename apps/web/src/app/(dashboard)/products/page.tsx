'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://65.1.110.181/api";

const mockProducts = [
  { id: '1', title: 'Classic Cotton T-Shirt', price: '₹599', stock: 45, status: 'Active' },
  { id: '2', title: 'Slim Fit Denim Jeans', price: '₹1,299', stock: 22, status: 'Active' },
  { id: '3', title: 'Leather Wallet', price: '₹899', stock: 0, status: 'Out of Stock' },
  { id: '4', title: 'Running Shoes Pro', price: '₹2,499', stock: 15, status: 'Active' },
  { id: '5', title: 'Wireless Earbuds', price: '₹1,999', stock: 8, status: 'Active' },
  { id: '6', title: 'Stainless Steel Bottle', price: '₹449', stock: 60, status: 'Active' },
  { id: '7', title: 'Backpack Urban', price: '₹1,799', stock: 0, status: 'Draft' },
  { id: '8', title: 'Sunglasses Aviator', price: '₹749', stock: 30, status: 'Active' },
];

function statusBadge(status: string): string {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-700';
    case 'Draft': return 'bg-gray-100 text-gray-600';
    case 'Out of Stock': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function ProductsPage(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_URL}/products?page=1&limit=20`, { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((res) => {
        if (res?.data) setProducts(res.data);
      })
      .catch(() => {
        // keep mock data on error
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} products in your catalog.</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Add Product
        </button>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:w-64"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
        <div className="ml-auto flex rounded-lg border border-gray-300">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`border-l border-gray-300 px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500'}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2.5" rx="0.5" />
              <rect x="1" y="6.75" width="14" height="2.5" rx="0.5" />
              <rect x="1" y="11.5" width="14" height="2.5" rx="0.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-4">
              {/* Image placeholder */}
              <div className="flex h-40 items-center justify-center rounded-lg bg-gray-100 text-3xl text-gray-300">
                🛍️
              </div>
              <div className="mt-3">
                <h3 className="font-medium text-gray-900">{product.title}</h3>
                <p className="mt-1 text-lg font-bold text-gray-900">{product.price}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{product.stock} in stock</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(product.status)}`}>
                    {product.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
                        🛍️
                      </div>
                      <span className="font-medium text-gray-900">{product.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{product.price}</td>
                  <td className="px-4 py-3 text-gray-600">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="mt-8 text-center text-gray-400">No products found.</div>
      )}
    </div>
  );
}
