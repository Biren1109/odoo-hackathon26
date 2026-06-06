'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import type { RFQ } from '@/types';

export default function RFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [rfq, setRFQ] = useState<RFQ | null>(null);

  useEffect(() => {
    api.get(`/rfqs/${id}`).then(r => setRFQ(r.data));
  }, [id]);

  const publishRFQ = async () => {
    await api.patch(`/rfqs/${id}/publish`);
    toast.success('RFQ published!');
    setRFQ(prev => prev ? { ...prev, status: 'PUBLISHED' } : prev);
  };

  if (!rfq) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{rfq.title}</h1>
          <p className="text-slate-500 text-sm mt-1">Deadline: {new Date(rfq.deadline).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          {rfq.status === 'DRAFT' && (
            <>
              <button onClick={() => router.push(`/rfqs/create?edit=${id}`)} className="border px-4 py-2 rounded-lg text-sm">Edit</button>
              <button onClick={publishRFQ} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Publish</button>
            </>
          )}
          {rfq.status === 'PUBLISHED' && rfq._count && rfq._count.quotations > 0 && (
            <button onClick={() => router.push(`/quotations/compare/${id}`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
              Compare Quotations ({rfq._count.quotations})
            </button>
          )}
          {user?.role === 'VENDOR' && rfq.status === 'PUBLISHED' && (
            <button onClick={() => router.push(`/rfqs/${id}/submit-quotation`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
              Submit Quotation
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
        <h2 className="font-semibold mb-4">Items</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-500"><tr><th className="text-left pb-2">Product</th><th>Qty</th><th>Unit</th></tr></thead>
          <tbody>
            {rfq.items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="py-2">{item.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-center">{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Assigned Vendors ({rfq.vendors?.length ?? 0})</h2>
        {rfq.vendors?.map(v => (
          <div key={v.id} className="flex justify-between items-center border-b py-2 text-sm">
            <span>{v.name}</span>
            <span className="text-slate-400">{v.email}</span>
          </div>
        ))}
      </div>
    </div>
  );
}