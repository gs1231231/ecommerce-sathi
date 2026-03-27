"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://65.1.110.181/api";

export default function RegisterPage(): React.ReactElement {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    storeName: "",
    storeSlug: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSlug(storeName: string): void {
    const slug = storeName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((f) => ({ ...f, storeName, storeSlug: slug }));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Registration failed");
        return;
      }

      // Store tokens
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.data.tokens.accessToken);
        localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("tenant", JSON.stringify(data.data.tenant));
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
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">Store Created!</h1>
        <p className="mt-2 text-gray-600">
          Your store <strong>{form.storeName}</strong> is ready.
        </p>
        <div className="mt-6 space-y-3">
          <Link
            href="/"
            className="block rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href={`/${form.storeSlug}`}
            className="block rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Your Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
          <span className="text-2xl">🛒</span> eCommerce Sathi
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Create your store</h1>
        <p className="mt-1 text-sm text-gray-500">Start selling online in 60 seconds</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Rahul Sharma"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="rahul@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="9876543210"
            pattern="[6-9][0-9]{9}"
            title="10 digit Indian mobile number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Min 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
          <input
            type="text"
            required
            value={form.storeName}
            onChange={(e) => handleSlug(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="My Awesome Store"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
            <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-500 border-r border-gray-300">
              ecommercesathi.com/
            </span>
            <input
              type="text"
              required
              value={form.storeSlug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  storeSlug: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, ""),
                }))
              }
              className="flex-1 px-3 py-2.5 text-sm outline-none"
              placeholder="my-awesome-store"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {loading ? "Creating your store..." : "Create Store — Free"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have a store?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </div>
  );
}
