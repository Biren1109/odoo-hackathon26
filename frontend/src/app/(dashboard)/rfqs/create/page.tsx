'use client';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { Vendor } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  deadline: z.string().min(1, 'Required'),
  items: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().min(1),
    unit: z.string().min(1),
  })).min(1, 'Add at least one item'),
  vendorIds: z.array(z.string()).optional(),
});
type FormData = z.infer<typeof schema>;

export default function CreateRFQPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);

  useEffect(() => {
    api.get('/vendors?status=ACTIVE').then(r => setVendors(r.data.data || []));
  }, []);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ name: '', quantity: 1, unit: 'pcs' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = async (data: FormData, publish = false) => {
    try {
      const res = await api.post('/rfqs', { ...data, vendorIds: selectedVendors, status: publish ? 'PUBLISHED' : 'DRAFT' });
      toast.success(publish ? 'RFQ published!' : 'RFQ saved as draft');
      router.push(`/rfqs/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="page-title mb-6">Create RFQ</h1>
      <form onSubmit={handleSubmit(d => onSubmit(d, false))} className="space-y-6">

        {/* Section 1: Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="section-title">RFQ Details</h2>
          <div>
            <label className="label">Title *</label>
            <input {...register('title')} className="input" />
            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} className="input" rows={3} />
          </div>
          <div>
            <label className="label">Deadline *</label>
            <input {...register('deadline')} type="date" className="input" />
            {errors.deadline && <p className="text-red-500 text-xs">{errors.deadline.message}</p>}
          </div>
        </div>

        {/* Section 2: Items */}
        <div className="card p-6">
          <div className="flex justify-between mb-4">
            <h2 className="section-title">Products / Services</h2>
            <button type="button" onClick={() => append({ name: '', quantity: 1, unit: 'pcs' })}
              className="text-sm text-indigo-600 hover:underline">+ Add Item</button>
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-4 gap-2 mb-2 items-start">
              <input {...register(`items.${i}.name`)} placeholder="Product name" className="input mt-0 py-1.5 col-span-2" />
              <input {...register(`items.${i}.quantity`, { valueAsNumber: true })} type="number" placeholder="Qty" className="input mt-0 py-1.5" />
              <div className="flex gap-1">
                <input {...register(`items.${i}.unit`)} placeholder="Unit" className="input mt-0 py-1.5 flex-1" />
                <button type="button" onClick={() => remove(i)} className="text-red-400 px-1">×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Section 3: Vendor Assignment */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Assign Vendors</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {vendors.map(v => (
              <label key={v.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" value={v.id}
                  checked={selectedVendors.includes(v.id)}
                  onChange={e => setSelectedVendors(prev =>
                    e.target.checked ? [...prev, v.id] : prev.filter(id => id !== v.id)
                  )}
                />
                {v.name} — <span className="text-slate-400">{v.email}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="border px-6 py-2 rounded-lg text-sm hover:bg-slate-100">
            Save Draft
          </button>
          <button type="button" disabled={isSubmitting}
            onClick={handleSubmit(d => onSubmit(d, true))}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-indigo-700">
            Publish RFQ
          </button>
        </div>
      </form>
    </div>
  );
}
