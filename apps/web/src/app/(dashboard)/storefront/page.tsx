'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Theme {
  id: string;
  name: string;
  description: string;
  active: boolean;
  color: string;
}

const themes: Theme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, white-space-focused design. Perfect for fashion and lifestyle brands.',
    active: true,
    color: 'bg-gray-100',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold typography with dynamic layouts. Great for electronics and gadgets.',
    active: false,
    color: 'bg-indigo-50',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Vibrant colors and large imagery. Ideal for food, art, and creative stores.',
    active: false,
    color: 'bg-orange-50',
  },
];

export default function StorefrontPage(): React.ReactElement {
  const [activeTheme, setActiveTheme] = useState('minimal');

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storefront</h1>
          <p className="mt-1 text-sm text-gray-500">Customize your store theme and appearance.</p>
        </div>
        <Link
          href="/editor"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Open Editor
        </Link>
      </div>

      {/* Theme Cards */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const isActive = activeTheme === theme.id;
          return (
            <div
              key={theme.id}
              className={`relative rounded-xl border-2 bg-white transition-colors ${
                isActive ? 'border-indigo-500' : 'border-gray-200'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute top-3 right-3 z-10 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Active
                </div>
              )}

              {/* Preview Thumbnail Placeholder */}
              <div className={`flex h-48 items-center justify-center rounded-t-xl ${theme.color}`}>
                <div className="text-center">
                  <div className="mx-auto mb-2 h-6 w-24 rounded bg-gray-300/60" />
                  <div className="mx-auto flex gap-2">
                    <div className="h-16 w-16 rounded bg-gray-300/40" />
                    <div className="h-16 w-16 rounded bg-gray-300/40" />
                    <div className="h-16 w-16 rounded bg-gray-300/40" />
                  </div>
                  <div className="mx-auto mt-2 h-3 w-20 rounded bg-gray-300/40" />
                </div>
              </div>

              {/* Theme Info */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">{theme.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{theme.description}</p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setActiveTheme(theme.id)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    disabled={isActive}
                  >
                    {isActive ? 'Current Theme' : 'Activate'}
                  </button>
                  <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Customize
                  </button>
                  <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Preview
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
