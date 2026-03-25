'use client';

import { useState } from 'react';

interface Discount {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed';
  value: string;
  usageUsed: number;
  usageLimit: number;
  status: 'Active' | 'Expired' | 'Scheduled';
  startDate: string;
  endDate: string;
}

const discounts: Discount[] = [
  { id: '1', code: 'WELCOME10', type: 'Percentage', value: '10%', usageUsed: 45, usageLimit: 100, status: 'Active', startDate: '01 Mar 2026', endDate: '31 Mar 2026' },
  { id: '2', code: 'FLAT200', type: 'Fixed', value: '₹200', usageUsed: 22, usageLimit: 50, status: 'Active', startDate: '15 Mar 2026', endDate: '15 Apr 2026' },
  { id: '3', code: 'SUMMER25', type: 'Percentage', value: '25%', usageUsed: 0, usageLimit: 200, status: 'Scheduled', startDate: '01 Apr 2026', endDate: '30 Apr 2026' },
  { id: '4', code: 'DIWALI500', type: 'Fixed', value: '₹500', usageUsed: 150, usageLimit: 150, status: 'Expired', startDate: '20 Oct 2025', endDate: '05 Nov 2025' },
  { id: '5', code: 'VIP15', type: 'Percentage', value: '15%', usageUsed: 8, usageLimit: 30, status: 'Active', startDate: '10 Mar 2026', endDate: '10 Apr 2026' },
  { id: '6', code: 'NEWYEAR100', type: 'Fixed', value: '₹100', usageUsed: 75, usageLimit: 75, status: 'Expired', startDate: '28 Dec 2025', endDate: '05 Jan 2026' },
];

function statusBadge(status: string): string {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-700';
    case 'Expired': return 'bg-gray-100 text-gray-600';
    case 'Scheduled': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function MarketingPage(): React.ReactElement {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing & Discounts</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage discount codes for your store.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create Discount
        </button>
      </div>

      {/* Create Discount Panel */}
      {showCreate && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">New Discount</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Code</label>
              <input
                type="text"
                placeholder="e.g. SAVE20"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                <option>Percentage</option>
                <option>Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Value</label>
              <input
                type="text"
                placeholder="e.g. 20% or ₹200"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Usage Limit</label>
              <input
                type="number"
                placeholder="e.g. 100"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Save Discount
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Discounts Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Usage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Start Date</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">End Date</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm font-medium text-gray-900">
                    {discount.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{discount.type}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{discount.value}</td>
                <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                  {discount.usageUsed}/{discount.usageLimit}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(discount.status)}`}>
                    {discount.status}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{discount.startDate}</td>
                <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{discount.endDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
