'use client';

import { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: string;
  tags: string[];
  lastOrder: string;
  segment: string;
}

const customers: Customer[] = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43210', orders: 12, totalSpent: '₹28,450', tags: ['VIP', 'Repeat'], lastOrder: '25 Mar 2026', segment: 'VIP' },
  { id: '2', name: 'Priya Patel', email: 'priya@example.com', phone: '+91 87654 32109', orders: 1, totalSpent: '₹1,899', tags: ['New'], lastOrder: '24 Mar 2026', segment: 'New' },
  { id: '3', name: 'Amit Kumar', email: 'amit@example.com', phone: '+91 76543 21098', orders: 5, totalSpent: '₹9,750', tags: ['Returning'], lastOrder: '22 Mar 2026', segment: 'Returning' },
  { id: '4', name: 'Sneha Gupta', email: 'sneha@example.com', phone: '+91 65432 10987', orders: 8, totalSpent: '₹15,200', tags: ['VIP'], lastOrder: '21 Mar 2026', segment: 'VIP' },
  { id: '5', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 54321 09876', orders: 2, totalSpent: '₹4,200', tags: ['Returning'], lastOrder: '19 Mar 2026', segment: 'Returning' },
  { id: '6', name: 'Neha Verma', email: 'neha@example.com', phone: '+91 43210 98765', orders: 1, totalSpent: '₹1,650', tags: ['New'], lastOrder: '18 Mar 2026', segment: 'New' },
  { id: '7', name: 'Arjun Reddy', email: 'arjun@example.com', phone: '+91 32109 87654', orders: 0, totalSpent: '₹0', tags: ['At Risk'], lastOrder: '02 Jan 2026', segment: 'At Risk' },
  { id: '8', name: 'Kavita Iyer', email: 'kavita@example.com', phone: '+91 21098 76543', orders: 3, totalSpent: '₹6,300', tags: ['At Risk'], lastOrder: '05 Feb 2026', segment: 'At Risk' },
];

const segments = ['All', 'New', 'Returning', 'VIP', 'At Risk'];

function tagColor(tag: string): string {
  switch (tag) {
    case 'VIP': return 'bg-purple-100 text-purple-700';
    case 'New': return 'bg-blue-100 text-blue-700';
    case 'Returning': return 'bg-green-100 text-green-700';
    case 'Repeat': return 'bg-indigo-100 text-indigo-700';
    case 'At Risk': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function CustomersPage(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [activeSegment, setActiveSegment] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesSegment = activeSegment === 'All' || c.segment === activeSegment;
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">{customers.length} customers in your store.</p>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:w-80"
        />
      </div>

      {/* Segment Tabs */}
      <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-1">
        {segments.map((seg) => (
          <button
            key={seg}
            onClick={() => setActiveSegment(seg)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeSegment === seg
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {seg}
          </button>
        ))}
      </div>

      {/* Customers Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Phone</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Total Spent</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Tags</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{customer.phone}</td>
                <td className="px-4 py-3 text-gray-900">{customer.orders}</td>
                <td className="hidden px-4 py-3 font-medium text-gray-900 sm:table-cell">{customer.totalSpent}</td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <div className="flex gap-1">
                    {customer.tags.map((tag) => (
                      <span key={tag} className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(tag)}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{customer.lastOrder}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Side Panel */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedCustomer(null)}
          />
          <div className="relative w-full max-w-md bg-white shadow-xl">
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-xl font-bold text-gray-900">{selectedCustomer.orders}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">Total Spent</p>
                      <p className="text-xl font-bold text-gray-900">{selectedCustomer.totalSpent}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Last Order</p>
                    <p className="font-medium text-gray-900">{selectedCustomer.lastOrder}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="mb-2 text-sm text-gray-500">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.tags.map((tag) => (
                        <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium ${tagColor(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
