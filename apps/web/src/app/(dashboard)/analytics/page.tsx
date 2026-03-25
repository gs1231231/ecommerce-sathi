'use client';

import { useState } from 'react';

const dateRanges = ['Today', '7 days', '30 days', 'Custom'];

const metricsData: Record<string, { revenue: string; orders: string; aov: string; conversion: string; revenueChange: string; ordersChange: string; aovChange: string; conversionChange: string }> = {
  'Today': { revenue: '₹12,450', orders: '8', aov: '₹1,556', conversion: '3.4%', revenueChange: '+12%', ordersChange: '+3', aovChange: '+₹120', conversionChange: '+0.2%' },
  '7 days': { revenue: '₹87,200', orders: '52', aov: '₹1,677', conversion: '3.1%', revenueChange: '+8%', ordersChange: '+6', aovChange: '+₹85', conversionChange: '-0.1%' },
  '30 days': { revenue: '₹3,45,600', orders: '198', aov: '₹1,745', conversion: '2.9%', revenueChange: '+15%', ordersChange: '+22', aovChange: '+₹150', conversionChange: '+0.3%' },
  'Custom': { revenue: '₹3,45,600', orders: '198', aov: '₹1,745', conversion: '2.9%', revenueChange: '+15%', ordersChange: '+22', aovChange: '+₹150', conversionChange: '+0.3%' },
};

const chartData = [
  { label: 'Mon', value: 65 },
  { label: 'Tue', value: 45 },
  { label: 'Wed', value: 80 },
  { label: 'Thu', value: 55 },
  { label: 'Fri', value: 90 },
  { label: 'Sat', value: 70 },
  { label: 'Sun', value: 40 },
];

const topProducts = [
  { name: 'Classic Cotton T-Shirt', unitsSold: 45, revenue: '₹26,955' },
  { name: 'Running Shoes Pro', unitsSold: 28, revenue: '₹69,972' },
  { name: 'Wireless Earbuds', unitsSold: 22, revenue: '₹43,978' },
  { name: 'Slim Fit Denim Jeans', unitsSold: 18, revenue: '₹23,382' },
  { name: 'Stainless Steel Bottle', unitsSold: 15, revenue: '₹6,735' },
];

const trafficSources = [
  { name: 'Direct', percent: 38, color: 'bg-indigo-500' },
  { name: 'Google', percent: 30, color: 'bg-blue-500' },
  { name: 'Instagram', percent: 20, color: 'bg-pink-500' },
  { name: 'WhatsApp', percent: 12, color: 'bg-green-500' },
];

export default function AnalyticsPage(): React.ReactElement {
  const [dateRange, setDateRange] = useState('Today');
  const metrics = metricsData[dateRange] ?? metricsData['Today'];

  const metricCards = [
    { label: 'Revenue', value: metrics.revenue, change: metrics.revenueChange },
    { label: 'Orders', value: metrics.orders, change: metrics.ordersChange },
    { label: 'Average Order Value', value: metrics.aov, change: metrics.aovChange },
    { label: 'Conversion Rate', value: metrics.conversion, change: metrics.conversionChange },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Track your store performance.</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="mt-6 flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
        {dateRanges.map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              dateRange === range
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <span className={`mt-1 inline-block text-xs font-medium ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
              {card.change}
            </span>
          </div>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Revenue Chart</h2>
        <div className="mt-4 flex items-end gap-3" style={{ height: 200 }}>
          {chartData.map((bar) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-indigo-500"
                style={{ height: `${(bar.value / 100) * 180}px` }}
              />
              <span className="text-xs text-gray-500">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Units Sold</th>
                <th className="px-6 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.name} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-3 text-gray-600">{product.unitsSold}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{product.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Traffic Sources */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Traffic Sources</h2>
          <div className="mt-4 space-y-4">
            {trafficSources.map((source) => (
              <div key={source.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{source.name}</span>
                  <span className="text-gray-500">{source.percent}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${source.color}`}
                    style={{ width: `${source.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
