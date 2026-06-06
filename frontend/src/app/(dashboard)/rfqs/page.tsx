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
        <h1 className="page-title">RFQs</h1>
        <button onClick={() => router.push('/rfqs/create')} className="btn-primary">+ Create RFQ</button>
      </div>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFQs..." className="input mt-0 flex-1" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select mt-0 w-40">
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm text-slate-800">
          <thead className="table-head">
            <tr><th className="p-4">Title</th><th className="p-4">Status</th><th className="p-4">Deadline</th><th className="p-4">Vendors</th><th className="p-4">Created By</th></tr>
          </thead>
          <tbody>
            {rfqs.map(rfq => (
              <tr key={rfq.id} className="table-row cursor-pointer" onClick={() => router.push(`/rfqs/${rfq.id}`)}>
                <td className="p-4 font-medium text-slate-900">{rfq.title}</td>
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