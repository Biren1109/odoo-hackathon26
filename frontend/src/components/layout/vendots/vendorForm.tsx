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
    name: z.string(), email: z.string(), phone: z.string(), designation: z.string()
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
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">Vendor Name</label>
          <input {...register('name')} className="w-full border rounded p-2 mt-1 text-sm" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}</div>
        <div><label className="text-sm font-medium">Email</label>
          <input {...register('email')} className="w-full border rounded p-2 mt-1 text-sm" />
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}</div>
        <div><label className="text-sm font-medium">Phone</label>
          <input {...register('phone')} className="w-full border rounded p-2 mt-1 text-sm" /></div>
        <div><label className="text-sm font-medium">GST Number</label>
          <input {...register('gstNumber')} className="w-full border rounded p-2 mt-1 text-sm" /></div>
        <div><label className="text-sm font-medium">Category</label>
          <input {...register('category')} className="w-full border rounded p-2 mt-1 text-sm" /></div>
        <div><label className="text-sm font-medium">Status</label>
          <select {...register('status')} className="w-full border rounded p-2 mt-1 text-sm">
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="BLOCKED">Blocked</option>
          </select></div>
      </div>
      <div><label className="text-sm font-medium">Address</label>
        <textarea {...register('address')} className="w-full border rounded p-2 mt-1 text-sm" rows={2} /></div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold">Contact Persons</label>
          <button type="button" onClick={() => append({ name: '', email: '', phone: '', designation: '' })}
            className="text-xs text-indigo-600 hover:underline">+ Add Contact</button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="grid grid-cols-4 gap-2 mb-2">
            <input {...register(`contacts.${i}.name`)} placeholder="Name" className="border rounded p-1.5 text-sm" />
            <input {...register(`contacts.${i}.email`)} placeholder="Email" className="border rounded p-1.5 text-sm" />
            <input {...register(`contacts.${i}.phone`)} placeholder="Phone" className="border rounded p-1.5 text-sm" />
            <div className="flex gap-1">
              <input {...register(`contacts.${i}.designation`)} placeholder="Title" className="border rounded p-1.5 text-sm flex-1" />
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 px-1">×</button>
            </div>
          </div>
        ))}
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
        {isSubmitting ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}
      </button>
    </form>
  );
}