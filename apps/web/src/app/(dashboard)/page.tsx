'use client';

const stats = [
  { label: 'Revenue Today', value: '₹12,450', change: '+12%', up: true },
  { label: 'Orders Today', value: '8', change: '+3', up: true },
  { label: 'Visitors', value: '234', change: '-5%', up: false },
  { label: 'Conversion Rate', value: '3.4%', change: '+0.2%', up: true },
];

const recentOrders = [
  { id: '#ES-1024', customer: 'Rahul Sharma', total: '₹2,499', status: 'Delivered', date: '21 Mar 2026' },
  { id: '#ES-1023', customer: 'Priya Patel', total: '₹1,899', status: 'Processing', date: '21 Mar 2026' },
  { id: '#ES-1022', customer: 'Amit Kumar', total: '₹3,150', status: 'Shipped', date: '20 Mar 2026' },
  { id: '#ES-1021', customer: 'Sneha Gupta', total: '₹749', status: 'Cancelled', date: '20 Mar 2026' },
  { id: '#ES-1020', customer: 'Vikram Singh', total: '₹4,200', status: 'Delivered', date: '19 Mar 2026' },
];

function statusColor(status: string): string {
  switch (status) {
    case 'Delivered': return 'bg-green-100 text-green-700';
    case 'Processing': return 'bg-yellow-100 text-yellow-700';
    case 'Shipped': return 'bg-blue-100 text-blue-700';
    case 'Cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Welcome back! Here&apos;s what&apos;s happening today.</p>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            <span className={`mt-1 inline-block text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Add Product
        </button>
        <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Create Order
        </button>
        <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          View Store
        </button>
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{order.id}</td>
                  <td className="px-4 py-3 text-gray-600">{order.customer}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{order.total}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
