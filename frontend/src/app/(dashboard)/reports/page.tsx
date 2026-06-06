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
    { label: 'Total Spend', value: `₹${((dashboard.totalSpend || 0) / 100000).toFixed(1)}L`, accent: 'border-l-indigo-500' },
    { label: 'Active RFQs', value: dashboard.activeRFQs ?? 0, accent: 'border-l-blue-500' },
    { label: 'Pending Approvals', value: dashboard.pendingApprovals ?? 0, accent: 'border-l-green-500' },
    { label: 'Overdue Invoices', value: dashboard.overdueInvoices ?? 0, accent: 'border-l-red-500' },
  ] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Reports & Analytics</h1>
        <button onClick={exportCSV} className="btn-secondary">⬇ Export CSV</button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`stat-card border-l-4 ${c.accent}`}>
            <p className="stat-label">{c.label}</p>
            <p className="stat-value">{c.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Monthly Trends */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Monthly Procurement Trends</h2>
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
        <div className="card p-6">
          <h2 className="section-title mb-4">Spending by Vendor</h2>
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
      <div className="table-wrap">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">Vendor Performance</div>
        <table className="w-full text-sm text-slate-800">
          <thead className="table-head">
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
              <tr key={v.vendorId} className="table-row">
                <td className="p-4 font-medium text-slate-900">{v.vendorName || v.name}</td>
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