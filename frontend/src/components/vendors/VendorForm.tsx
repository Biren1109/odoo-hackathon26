<<<<<<< HEAD
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
=======
'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
  phone: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  gstNumber: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  status: z.enum(['ACTIVE', 'PENDING', 'BLOCKED']).default('PENDING'),
  contacts: z.array(z.object({
    name: z.string(), email: z.string(), phone: z.string(), designation: z.string(),
  })).optional(),
});
type FormData = z.infer<typeof schema>;


export default function VendorForm({ vendor, onSuccess }: { vendor?: any; onSuccess: () => void }) {
  const isEdit = !!vendor;
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: vendor || { status: 'PENDING', contacts: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) await api.put(`/vendors/${vendor.id}`, data);
      else await api.post('/vendors', data);
      toast.success(isEdit ? 'Vendor updated!' : 'Vendor added!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
>>>>>>> c20cc5ea97db90acb5a0d849c40fa48c46dff8e8
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Vendor Name</label>
          <input {...register('name')} className="input" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Email</label>
          <input {...register('email')} className="input" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register('phone')} className="input" />
        </div>
        <div>
          <label className="label">GST Number</label>
          <input {...register('gstNumber')} className="input" />
        </div>
        <div>
          <label className="label">Category</label>
          <input {...register('category')} className="input" />
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="select">
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Address</label>
        <textarea {...register('address')} className="input" rows={2} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="label font-semibold">Contact Persons</label>
          <button type="button" onClick={() => append({ name: '', email: '', phone: '', designation: '' })}
            className="text-xs text-indigo-600 hover:underline">+ Add Contact</button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="grid grid-cols-4 gap-2 mb-2">
            <input {...register(`contacts.${i}.name`)} placeholder="Name" className="input mt-0 py-1.5" />
            <input {...register(`contacts.${i}.email`)} placeholder="Email" className="input mt-0 py-1.5" />
            <input {...register(`contacts.${i}.phone`)} placeholder="Phone" className="input mt-0 py-1.5" />
            <div className="flex gap-1">
              <input {...register(`contacts.${i}.designation`)} placeholder="Title" className="input mt-0 py-1.5 flex-1" />
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 px-1">×</button>
            </div>
          </div>
        ))}
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full btn-primary py-2.5">
        {isSubmitting ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}
      </button>
>>>>>>> c20cc5ea97db90acb5a0d849c40fa48c46dff8e8
    </form>
  );
}
