'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://65.1.110.181/api";

const mockOrders = [
  { id: '#ES-1030', date: '21 Mar 2026', customer: 'Rahul Sharma', total: '₹2,499', payment: 'Paid', fulfillment: 'Delivered' },
  { id: '#ES-1029', date: '21 Mar 2026', customer: 'Priya Patel', total: '₹1,899', payment: 'Paid', fulfillment: 'Processing' },
  { id: '#ES-1028', date: '20 Mar 2026', customer: 'Amit Kumar', total: '₹3,150', payment: 'Paid', fulfillment: 'Shipped' },
  { id: '#ES-1027', date: '20 Mar 2026', customer: 'Sneha Gupta', total: '₹749', payment: 'Refunded', fulfillment: 'Cancelled' },
  { id: '#ES-1026', date: '19 Mar 2026', customer: 'Vikram Singh', total: '₹4,200', payment: 'Paid', fulfillment: 'Delivered' },
  { id: '#ES-1025', date: '19 Mar 2026', customer: 'Neha Verma', total: '₹1,650', payment: 'Pending', fulfillment: 'Processing' },
  { id: '#ES-1024', date: '18 Mar 2026', customer: 'Arjun Reddy', total: '₹5,999', payment: 'Paid', fulfillment: 'Shipped' },
  { id: '#ES-1023', date: '18 Mar 2026', customer: 'Kavita Iyer', total: '₹899', payment: 'Paid', fulfillment: 'Delivered' },
  { id: '#ES-1022', date: '17 Mar 2026', customer: 'Rohan Mehta', total: '₹2,100', payment: 'Failed', fulfillment: 'Cancelled' },
  { id: '#ES-1021', date: '17 Mar 2026', customer: 'Deepa Nair', total: '₹3,450', payment: 'Paid', fulfillment: 'Processing' },
];

function fulfillmentColor(status: string): string {
  switch (status) {
    case 'Delivered': return 'bg-green-100 text-green-700';
    case 'Processing': return 'bg-yellow-100 text-yellow-700';
    case 'Shipped': return 'bg-blue-100 text-blue-700';
    case 'Cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function paymentColor(status: string): string {
  switch (status) {
    case 'Paid': return 'bg-green-100 text-green-700';
    case 'Pending': return 'bg-yellow-100 text-yellow-700';
    case 'Refunded': return 'bg-gray-100 text-gray-600';
    case 'Failed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function OrdersPage(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [orders, setOrders] = useState(mockOrders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_URL}/orders?page=1&limit=20`, { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((res) => {
        if (res?.data) setOrders(res.data);
      })
      .catch(() => {
        // keep mock data on error
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.fulfillment === statusFilter;
    const matchesPayment = paymentFilter === 'All' || o.payment === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">Manage and track all your orders.</p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="All">All Fulfillment</option>
          <option value="Delivered">Delivered</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="All">All Payments</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Refunded">Refunded</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500">
              <th className="px-4 py-3 font-medium">Order #</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{order.id}</td>
                <td className="px-4 py-3 text-gray-500">{order.date}</td>
                <td className="px-4 py-3 text-gray-600">{order.customer}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{order.total}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentColor(order.payment)}`}>
                    {order.payment}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${fulfillmentColor(order.fulfillment)}`}>
                    {order.fulfillment}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
