'use client';

interface Transaction {
  id: string;
  date: string;
  orderNumber: string;
  customer: string;
  amount: string;
  method: string;
  status: 'Completed' | 'Pending' | 'Refunded' | 'Failed';
}

const summaryCards = [
  { label: 'Total Collected', value: '₹3,45,600', change: '+15% vs last month' },
  { label: 'Pending Payouts', value: '₹24,300', change: 'Next payout: 28 Mar' },
  { label: 'Refunds', value: '₹8,450', change: '3 refunds this month' },
];

const transactions: Transaction[] = [
  { id: '1', date: '25 Mar 2026', orderNumber: '#ES-1040', customer: 'Rahul Sharma', amount: '₹2,499', method: 'UPI', status: 'Completed' },
  { id: '2', date: '25 Mar 2026', orderNumber: '#ES-1039', customer: 'Priya Patel', amount: '₹1,899', method: 'Card', status: 'Completed' },
  { id: '3', date: '24 Mar 2026', orderNumber: '#ES-1038', customer: 'Amit Kumar', amount: '₹3,150', method: 'UPI', status: 'Pending' },
  { id: '4', date: '24 Mar 2026', orderNumber: '#ES-1037', customer: 'Sneha Gupta', amount: '₹749', method: 'COD', status: 'Completed' },
  { id: '5', date: '23 Mar 2026', orderNumber: '#ES-1036', customer: 'Vikram Singh', amount: '₹4,200', method: 'Card', status: 'Refunded' },
  { id: '6', date: '23 Mar 2026', orderNumber: '#ES-1035', customer: 'Neha Verma', amount: '₹1,650', method: 'UPI', status: 'Completed' },
  { id: '7', date: '22 Mar 2026', orderNumber: '#ES-1034', customer: 'Arjun Reddy', amount: '₹5,999', method: 'Card', status: 'Failed' },
  { id: '8', date: '22 Mar 2026', orderNumber: '#ES-1033', customer: 'Kavita Iyer', amount: '₹899', method: 'UPI', status: 'Completed' },
  { id: '9', date: '21 Mar 2026', orderNumber: '#ES-1032', customer: 'Rohan Mehta', amount: '₹2,100', method: 'COD', status: 'Pending' },
  { id: '10', date: '21 Mar 2026', orderNumber: '#ES-1031', customer: 'Deepa Nair', amount: '₹3,450', method: 'UPI', status: 'Completed' },
];

function statusColor(status: string): string {
  switch (status) {
    case 'Completed': return 'bg-green-100 text-green-700';
    case 'Pending': return 'bg-yellow-100 text-yellow-700';
    case 'Refunded': return 'bg-gray-100 text-gray-600';
    case 'Failed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function methodBadge(method: string): string {
  switch (method) {
    case 'UPI': return 'bg-purple-50 text-purple-700';
    case 'Card': return 'bg-blue-50 text-blue-700';
    case 'COD': return 'bg-orange-50 text-orange-700';
    default: return 'bg-gray-50 text-gray-700';
  }
}

export default function FinancesPage(): React.ReactElement {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
      <p className="mt-1 text-sm text-gray-500">Track payments, payouts, and refunds.</p>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-400">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Payout Schedule */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Payout Schedule</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:gap-8">
          <div>
            <span className="text-gray-500">Frequency: </span>
            <span className="font-medium text-gray-900">Weekly (Every Monday)</span>
          </div>
          <div>
            <span className="text-gray-500">Next Payout: </span>
            <span className="font-medium text-gray-900">28 Mar 2026</span>
          </div>
          <div>
            <span className="text-gray-500">Payout Method: </span>
            <span className="font-medium text-gray-900">Bank Transfer (HDFC ****4521)</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{txn.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{txn.orderNumber}</td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{txn.customer}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{txn.amount}</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${methodBadge(txn.method)}`}>
                      {txn.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
