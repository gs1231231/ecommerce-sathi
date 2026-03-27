'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface CommandItem {
  icon: string;
  label: string;
  shortcut?: string;
  href: string;
  category: 'Quick Actions' | 'Pages';
}

const COMMANDS: CommandItem[] = [
  // Quick Actions
  { icon: '+', label: 'Add Product', shortcut: 'P', href: '/products/new', category: 'Quick Actions' },
  { icon: '#', label: 'Create Order', shortcut: 'O', href: '/orders/new', category: 'Quick Actions' },
  { icon: '%', label: 'Create Discount', shortcut: 'D', href: '/discounts/new', category: 'Quick Actions' },
  { icon: '@', label: 'View Store', shortcut: 'S', href: '/storefront', category: 'Quick Actions' },
  // Pages
  { icon: '~', label: 'Dashboard', href: '/', category: 'Pages' },
  { icon: '!', label: 'Orders', href: '/orders', category: 'Pages' },
  { icon: '&', label: 'Products', href: '/products', category: 'Pages' },
  { icon: '^', label: 'Customers', href: '/customers', category: 'Pages' },
  { icon: '*', label: 'Analytics', href: '/analytics', category: 'Pages' },
  { icon: '=', label: 'Settings', href: '/settings', category: 'Pages' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps): React.ReactElement | null {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const grouped: Record<string, CommandItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const flatFiltered = Object.values(grouped).flat();

  const navigate = useCallback(
    (href: string): void => {
      onClose();
      setQuery('');
      window.location.href = href;
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % (flatFiltered.length || 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + (flatFiltered.length || 1)) % (flatFiltered.length || 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatFiltered[selectedIndex];
        if (item) navigate(item.href);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, flatFiltered, selectedIndex, navigate]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {flatFiltered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-gray-500">
              No results found.
            </p>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {category}
              </p>
              {items.map((item) => {
                const globalIdx = flatFiltered.indexOf(item);
                const isSelected = globalIdx === selectedIndex;
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-base font-medium text-gray-500">
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
