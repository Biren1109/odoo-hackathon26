'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function PurchaseOrdersPage() {
    const router = useRouter();
    const [pos, setPOs] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        api.get(`/purchase-orders${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => setPOs(r.data.data || []));
    }, [statusFilter]);

    const statusColor: Record<string, string> = {
        DRAFT: 'bg-slate-100 text-slate-600',
        CONFIRMED: 'bg-blue-100 text-blue-700',
        DELIVERED: 'bg-green-100 text-green-700',
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Purchase Orders</h1>
            <div className="flex gap-3 mb-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg p-2 text-sm">
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DELIVERED">Delivered</option>
                </select>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                        <tr><th className="p-4">PO Number</th><th>Vendor</th><th>Grand Total</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                        {pos.map(po => (
                            <tr key={po.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                                <td className="p-4 font-mono text-xs">{po.poNumber}</td>
                                <td>{po.vendor?.name}</td>
                                <td>₹{po.grandTotal?.toLocaleString()}</td>
                                <td><span className={`${statusColor[po.status]} px-2 py-0.5 rounded text-xs`}>{po.status}</span></td>
                                <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}