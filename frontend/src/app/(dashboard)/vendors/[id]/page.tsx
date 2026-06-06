'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import VendorForm from '@/components/vendors/VendorForm';
import type { Vendor } from '@/types';

export default function VendorDetailPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [rfqs, setRFQs] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);

  const fetchVendor = async () => {
    const res = await api.get(`/vendors/${id}`);
    setVendor(res.data);
  };

  useEffect(() => {
    fetchVendor();
    api.get(`/rfqs?vendorId=${id}`).then(r => setRFQs(r.data.data || []));
  }, [id]);

  if (!vendor) return <div className="p-8 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        <button onClick={() => setEditing(!editing)} className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-100">
          {editing ? 'Cancel' : 'Edit Vendor'}
        </button>
      </div>

      {editing ? (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <VendorForm vendor={vendor} onSuccess={() => { setEditing(false); fetchVendor(); }} />
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-slate-500">Email</p><p className="font-medium">{vendor.email}</p></div>
            <div><p className="text-slate-500">Phone</p><p className="font-medium">{vendor.phone}</p></div>
            <div><p className="text-slate-500">GST Number</p><p className="font-mono">{vendor.gstNumber}</p></div>
            <div><p className="text-slate-500">Category</p><p className="font-medium">{vendor.category}</p></div>
            <div><p className="text-slate-500">Status</p>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{vendor.status}</span>
            </div>
            <div><p className="text-slate-500">Address</p><p className="font-medium">{vendor.address}</p></div>
          </div>

          {vendor.contacts && vendor.contacts.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold mb-2">Contact Persons</p>
              {vendor.contacts.map(c => (
                <div key={c.id} className="flex gap-4 text-sm text-slate-600 border-t py-2">
                  <span>{c.name}</span><span>{c.email}</span><span>{c.phone}</span><span className="text-slate-400">{c.designation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Assigned RFQs ({rfqs.length})</h2>
        {rfqs.map(rfq => (
          <div key={rfq.id} className="flex justify-between items-center border-b py-2 text-sm">
            <span>{rfq.title}</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{rfq.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}