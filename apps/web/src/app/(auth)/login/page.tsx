"use client";

import { useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://65.1.110.181/api";

export default function LoginPage(): React.ReactElement {
  const [form, setForm] = useState({ email: "", password: "", tenantSlug: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message ?? "Login failed");
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.data.tokens.accessToken);
        localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("tenant", JSON.stringify(data.data.tenant));
        window.location.href = "/";
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
          <span className="text-2xl">🛒</span> eCommerce Sathi
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to manage your store</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Store Slug</label>
          <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
            <span className="bg-gray-50 px-3 py-2.5 text-sm text-gray-500 border-r border-gray-300">
              ecommercesathi.com/
            </span>
            <input
              type="text"
              required
              value={form.tenantSlug}
              onChange={(e) => setForm((f) => ({ ...f, tenantSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
              className="flex-1 px-3 py-2.5 text-sm outline-none"
              placeholder="my-store"
            />
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have a store?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Create one free
        </Link>
      </p>
    </div>
  );
}
