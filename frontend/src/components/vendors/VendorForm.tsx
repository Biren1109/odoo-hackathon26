import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { Vendor } from '@/types';

interface VendorFormProps {
  vendor?: Vendor;
  onSuccess: () => void;
}

export default function VendorForm({ vendor, onSuccess }: VendorFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    gstNumber: vendor?.gstNumber || '',
    category: vendor?.category || 'General',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (vendor) {
        await api.put(`/vendors/${vendor.id}`, formData);
        toast.success('Vendor updated successfully');
      } else {
        await api.post('/vendors', formData);
        toast.success('Vendor created successfully');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Vendor Name</label>
        <input
          required
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            required
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Phone</label>
          <input
            required
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Address</label>
        <input
          required
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">GST Number</label>
          <input
            required
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="General">General</option>
            <option value="IT">IT</option>
            <option value="Hardware">Hardware</option>
            <option value="Services">Services</option>
          </select>
        </div>
      </div>
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : vendor ? 'Update Vendor' : 'Create Vendor'}
        </button>
      </div>
    </form>
  );
}
