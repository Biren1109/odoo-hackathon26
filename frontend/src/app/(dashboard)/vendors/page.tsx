'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import VendorForm from '@/components/vendors/VendorForm';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Vendor } from '@/types';

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchVendors = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const res = await api.get(`/vendors?${params}`);
    setVendors(res.data.data || []);
  }, [search, statusFilter]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      BLOCKED: 'bg-red-100 text-red-700',
    };
    return <span className={`${map[s] || ''} px-2 py-0.5 rounded text-xs font-medium`}>{s}</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Vendor Management</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add Vendor
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, GST..."
          className="input mt-0 flex-1" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select mt-0 w-40">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="w-full text-sm text-slate-800">
          <thead className="table-head">
            <tr><th className="p-4">Vendor Name</th><th className="p-4">Email</th><th className="p-4">GST No.</th><th className="p-4">Category</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id} className="table-row">
                <td className="p-4 font-medium text-slate-900">{v.name}</td>
                <td>{v.email}</td>
                <td className="font-mono text-xs">{v.gstNumber}</td>
                <td>{v.category}</td>
                <td>{statusBadge(v.status)}</td>
                <td>
                  <button onClick={() => router.push(`/vendors/${v.id}`)} className="text-indigo-600 hover:underline text-xs">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between mb-4">
              <h2 className="section-title">Add Vendor</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">×</button>
            </div>
            <VendorForm onSuccess={() => { setShowModal(false); fetchVendors(); }} />
          </div>
        </div>
      )}
    </div>
  );
}