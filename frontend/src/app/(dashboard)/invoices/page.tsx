'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        api.get(`/invoices${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => setInvoices(r.data.data || []));
    }, [statusFilter]);

    const statusColor: Record<string, string> = {
        DRAFT: 'bg-slate-100 text-slate-600',
        ISSUED: 'bg-blue-100 text-blue-700',
        PAID: 'bg-green-100 text-green-700',
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Invoices</h1>
            <div className="mb-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg p-2 text-sm">
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ISSUED">Issued</option>
                    <option value="PAID">Paid</option>
                </select>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr><th className="p-4">Invoice #</th><th>PO #</th><th>Vendor</th><th>Total</th><th>Status</th><th>Issued</th></tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
                                <td className="p-4 font-mono text-xs">{inv.invoiceNumber}</td>
                                <td className="font-mono text-xs">{inv.poNumber}</td>
                                <td>{inv.vendor?.name}</td>
                                <td>₹{inv.totalAmount?.toLocaleString()}</td>
                                <td><span className={`${statusColor[inv.status]} px-2 py-0.5 rounded text-xs`}>{inv.status}</span></td>
                                <td>{inv.issuedDate ? new Date(inv.issuedDate).toLocaleDateString() : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}