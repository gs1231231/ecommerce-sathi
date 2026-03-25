'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/orders', label: 'Orders', icon: '📦', badge: 3 },
  { href: '/products', label: 'Products', icon: '🛍️' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
  { href: '/storefront', label: 'Storefront', icon: '🏪' },
  { href: '/shipping', label: 'Shipping', icon: '🚚' },
  { href: '/finances', label: 'Finances', icon: '💰' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const mobileNavItems = [
  { href: '/orders', label: 'Orders', icon: '📦' },
  { href: '/products', label: 'Products', icon: '🛍️' },
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle - hidden on mobile */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:inline-flex"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-gray-900">eCommerce Sathi</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
          M
        </div>
      </header>

      {/* Sidebar - desktop only */}
      <aside
        className={`fixed top-14 left-0 bottom-0 z-20 hidden border-r border-gray-200 bg-white transition-all duration-200 md:block ${
          collapsed ? 'w-16' : 'w-65'
        }`}
      >
        <nav className="flex flex-col gap-1 p-2 pt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {!collapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main
        className={`pt-14 pb-16 transition-all duration-200 md:pb-0 ${
          collapsed ? 'md:pl-16' : 'md:pl-65'
        }`}
      >
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200 bg-white md:hidden">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
