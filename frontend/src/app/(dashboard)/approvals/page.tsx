'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { Approval } from '@/types';

const TABS = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export default function ApprovalsPage() {
    const { user } = useAuthStore();
    const [tab, setTab] = useState<typeof TABS[number]>('PENDING');
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [selected, setSelected] = useState<Approval | null>(null);
    const [remarks, setRemarks] = useState('');

    const fetchApprovals = async () => {
        const res = await api.get(`/approvals?status=${tab}`);
        setApprovals(res.data.data || []);
    };

    useEffect(() => { fetchApprovals(); }, [tab]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (action === 'reject' && !remarks) { toast.error('Remarks required for rejection'); return; }
        try {
            await api.patch(`/approvals/${id}/${action}`, { remarks });
            toast.success(action === 'approve' ? 'Approved!' : 'Rejected');
            setSelected(null);
            setRemarks('');
            fetchApprovals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    const statusColor: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
    };

    return (
        <div className="flex gap-6">
            {/* Main List */}
            <div className="flex-1">
                <h1 className="page-title mb-6">Approvals</h1>
                <div className="flex gap-2 mb-4">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {approvals.map(a => (
                        <div key={a.id} onClick={() => setSelected(a)}
                            className="card p-4 cursor-pointer hover:border-indigo-300 transition text-slate-800">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{a.quotation?.rfq?.title ?? 'RFQ'}</p>
                                    <p className="text-sm text-slate-500">{a.quotation?.vendor?.name} · ₹{a.quotation?.totalAmount?.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`${statusColor[a.status]} px-2 py-0.5 rounded text-xs`}>{a.status}</span>
                                    <span className="text-xs text-slate-400">Level: {a.level}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {approvals.length === 0 && <p className="text-slate-400 text-sm">No {tab.toLowerCase()} approvals.</p>}
                </div>
            </div>

            {/* Slide-out Detail Panel */}
            {selected && (
                <div className="w-96 bg-white rounded-xl shadow-lg p-6 border sticky top-6 self-start">
                    <div className="flex justify-between mb-4">
                        <h2 className="font-semibold">Approval Details</h2>
                        <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">×</button>
                    </div>

                    <div className="space-y-3 text-sm mb-4">
                        <div><p className="text-slate-500">Vendor</p><p className="font-medium">{selected.quotation?.vendor?.name}</p></div>
                        <div><p className="text-slate-500">Total Amount</p><p className="font-medium">₹{selected.quotation?.totalAmount?.toLocaleString()}</p></div>
                        <div><p className="text-slate-500">Delivery</p><p>{selected.quotation?.deliveryTimeline}</p></div>
                        <div><p className="text-slate-500">Payment Terms</p><p>{selected.quotation?.paymentTerms || '—'}</p></div>
                    </div>

                    {/* Approval Timeline */}
                    <div className="mb-4">
                        <p className="font-semibold text-sm mb-2">Timeline</p>
                        {selected.timeline?.map(t => (
                            <div key={t.id} className="border-l-2 border-indigo-200 pl-3 mb-2">
                                <p className="text-xs font-medium">{t.action} — {t.actor?.firstName} {t.actor?.lastName}</p>
                                {t.remarks && <p className="text-xs text-slate-500">{t.remarks}</p>}
                                <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Manager Actions */}
                    {user?.role === 'MANAGER' && selected.status === 'PENDING' && (
                        <div className="space-y-3">
                            <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                                placeholder="Remarks (required for rejection)"
                                className="w-full border rounded-lg p-2 text-sm" rows={2} />
                            <div className="flex gap-2">
                                <button onClick={() => handleAction(selected.id, 'approve')}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">
                                    ✓ Approve
                                </button>
                                <button onClick={() => handleAction(selected.id, 'reject')}
                                    className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm hover:bg-red-600">
                                    ✗ Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}