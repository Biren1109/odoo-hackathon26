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
    { label: 'Active RFQs', value: data.activeRFQs, accent: 'border-l-blue-500' },
    { label: 'Pending Approvals', value: data.pendingApprovals, accent: 'border-l-amber-500' },
    { label: 'POs This Month (₹)', value: `₹${((data.poThisMonthValue || 0)/100000).toFixed(1)}L`, accent: 'border-l-green-500' },
    { label: 'Overdue Invoices', value: data.overdueInvoices, accent: 'border-l-red-500' },
  ] : [];

  return (
    <div>
      <h1 className="page-title mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`stat-card border-l-4 ${c.accent}`}>
            <p className="stat-label">{c.label}</p>
            <p className="stat-value">{c.value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button onClick={() => router.push('/rfqs/create')} className="btn-primary">+ Create RFQ</button>
        <button onClick={() => router.push('/vendors')} className="btn-secondary">+ Add Vendor</button>
        <button onClick={() => router.push('/approvals')} className="btn-secondary">View Approvals</button>
        <button onClick={() => router.push('/invoices')} className="btn-secondary">Generate Invoice</button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Purchase Orders</h2>
          <table className="w-full text-sm text-slate-800">
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
        <div className="card p-5">
          <h2 className="section-title mb-4">Recent Invoices</h2>
          <table className="w-full text-sm text-slate-800">
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