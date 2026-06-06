'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import type { RFQ } from '@/types';

export default function RFQsPage() {
  const router = useRouter();
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/rfqs?${params}`).then(r => setRFQs(r.data.data || []));
  }, [search, statusFilter]);

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    PUBLISHED: 'bg-blue-100 text-blue-700',
    CLOSED: 'bg-green-100 text-green-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">RFQs</h1>
        <button onClick={() => router.push('/rfqs/create')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">+ Create RFQ</button>
      </div>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFQs..." className="border rounded-lg p-2 text-sm flex-1" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg p-2 text-sm">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr><th className="p-4">Title</th><th>Status</th><th>Deadline</th><th>Vendors</th><th>Created By</th></tr>
          </thead>
          <tbody>
            {rfqs.map(rfq => (
              <tr key={rfq.id} className="border-t hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/rfqs/${rfq.id}`)}>
                <td className="p-4 font-medium">{rfq.title}</td>
                <td><span className={`${statusColor[rfq.status]} px-2 py-0.5 rounded text-xs`}>{rfq.status}</span></td>
                <td>{new Date(rfq.deadline).toLocaleDateString()}</td>
                <td>{rfq.vendors?.length ?? 0}</td>
                <td>{rfq.createdBy?.firstName} {rfq.createdBy?.lastName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}