'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<any[]>([]);
  const [vendorPerf, setVendorPerf] = useState<any[]>([]);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setDashboard(r.data));
    api.get('/reports/monthly-trends').then(r => setMonthlyTrends(r.data.data || []));
    api.get('/reports/spending-summary').then(r => setSpendingSummary(r.data.data || []));
    api.get('/reports/vendor-performance').then(r => setVendorPerf(r.data.data || []));
  }, []);

  const exportCSV = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/reports/export?type=vendor-performance&format=csv`;
  };

  const cards = dashboard ? [
    { label: 'Total Spend', value: `₹${(dashboard.totalSpend / 100000).toFixed(1)}L`, color: 'bg-indigo-500' },
    { label: 'Active Vendors', value: dashboard.activeVendors, color: 'bg-blue-500' },
    { label: 'PO Fulfillment', value: `${dashboard.poFulfillmentRate?.toFixed(0)}%`, color: 'bg-green-500' },
    { label: 'Overdue Invoices', value: dashboard.overdueInvoicesCount, color: 'bg-red-500' },
  ] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <button onClick={exportCSV} className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-100">⬇ Export CSV</button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`${c.color} text-white rounded-xl p-5`}>
            <p className="text-sm opacity-80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Monthly Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Monthly Procurement Trends</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rfqs" stroke="#6366f1" name="RFQs" />
              <Line type="monotone" dataKey="pos" stroke="#22c55e" name="POs" />
              <Line type="monotone" dataKey="invoices" stroke="#f59e0b" name="Invoices" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Vendor */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Spending by Vendor</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={spendingSummary.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vendor" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString()}`} />
              <Bar dataKey="totalSpend" fill="#6366f1" name="Spend (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor Performance Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b font-semibold">Vendor Performance</div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-4">Vendor</th>
              <th>RFQs Invited</th>
              <th>Quotes Submitted</th>
              <th>Acceptance Rate</th>
              <th>Avg. Delivery</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {vendorPerf.map((v: any) => (
              <tr key={v.vendorId} className="border-t">
                <td className="p-4 font-medium">{v.name}</td>
                <td className="text-center">{v.rfqsInvited}</td>
                <td className="text-center">{v.quotesSubmitted}</td>
                <td className="text-center">{v.acceptanceRate?.toFixed(0)}%</td>
                <td className="text-center">{v.avgDelivery}</td>
                <td className="text-center">{'⭐'.repeat(Math.round(v.rating || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}