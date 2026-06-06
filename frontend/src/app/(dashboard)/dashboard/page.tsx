'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface DashboardData {
  activeRFQs: number;
  pendingApprovals: number;
  poThisMonthValue: number;
  overdueInvoices: number;
  recentPOs: any[];
  recentInvoices: any[];
  pendingApprovalsList: any[];
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setData(r.data)).catch(() => toast.error('Failed to load dashboard'));
  }, []);

  const cards = data ? [
    { label: 'Active RFQs', value: data.activeRFQs, color: 'bg-blue-500' },
    { label: 'Pending Approvals', value: data.pendingApprovals, color: 'bg-yellow-500' },
    { label: 'POs This Month (₹)', value: `₹${(data.poThisMonthValue/100000).toFixed(1)}L`, color: 'bg-green-500' },
    { label: 'Overdue Invoices', value: data.overdueInvoices, color: 'bg-red-500' },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Analytics Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`${c.color} text-white rounded-xl p-5`}>
            <p className="text-sm opacity-80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <button onClick={() => router.push('/rfqs/create')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ Create RFQ</button>
        <button onClick={() => router.push('/vendors')} className="bg-slate-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">+ Add Vendor</button>
        <button onClick={() => router.push('/approvals')} className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-100">View Approvals</button>
        <button onClick={() => router.push('/invoices')} className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-100">Generate Invoice</button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Purchase Orders */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Recent Purchase Orders</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b"><th className="pb-2">PO #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {data?.recentPOs?.map((po: any) => (
                <tr key={po.id} className="border-b last:border-0 cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                  <td className="py-2 font-mono text-xs">{po.poNumber}</td>
                  <td>{po.vendor?.name}</td>
                  <td>₹{po.grandTotal?.toLocaleString()}</td>
                  <td><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{po.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Recent Invoices</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b"><th className="pb-2">Invoice #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {data?.recentInvoices?.map((inv: any) => (
                <tr key={inv.id} className="border-b last:border-0 cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/invoices/${inv.id}`)}>
                  <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td>{inv.vendor?.name}</td>
                  <td>₹{inv.totalAmount?.toLocaleString()}</td>
                  <td><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}