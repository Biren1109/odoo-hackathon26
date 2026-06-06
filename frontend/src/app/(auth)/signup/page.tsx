'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const schema = z.object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    username: z.string().min(3, 'Min 3 characters'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    country: z.string().optional(),
    password: z.string().min(8, 'Min 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['OFFICER', 'MANAGER', 'VENDOR']),
    additionalInfo: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match", path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            const res = await api.post('/auth/signup', data);
            const { user, accessToken } = res.data;
            setAuth(user, accessToken);
            toast.success('Account created!');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-8">
            <div className="bg-white p-8 rounded-xl shadow w-full max-w-lg">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Create Account</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">First Name</label>
                            <input {...register('firstName')} className="w-full border rounded-lg p-2 mt-1 text-sm" />
                            {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Last Name</label>
                            <input {...register('lastName')} className="w-full border rounded-lg p-2 mt-1 text-sm" />
                            {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Username</label>
                        <input {...register('username')} className="w-full border rounded-lg p-2 mt-1 text-sm" />
                        {errors.username && <p className="text-red-500 text-xs">{errors.username.message}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input {...register('email')} className="w-full border rounded-lg p-2 mt-1 text-sm" />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Phone</label>
                            <input {...register('phone')} className="w-full border rounded-lg p-2 mt-1 text-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Country</label>
                            <input {...register('country')} className="w-full border rounded-lg p-2 mt-1 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Role</label>
                        <select {...register('role')} className="w-full border rounded-lg p-2 mt-1 text-sm">
                            <option value="OFFICER">Procurement Officer</option>
                            <option value="MANAGER">Manager / Approver</option>
                            <option value="VENDOR">Vendor</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <input {...register('password')} type="password" className="w-full border rounded-lg p-2 mt-1 text-sm" />
                        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Confirm Password</label>
                        <input {...register('confirmPassword')} type="password" className="w-full border rounded-lg p-2 mt-1 text-sm" />
                        {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Additional Info (optional)</label>
                        <textarea {...register('additionalInfo')} className="w-full border rounded-lg p-2 mt-1 text-sm" rows={2} />
                    </div>
                    <button type="submit" disabled={isSubmitting}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                        {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
                <p className="mt-4 text-sm text-center">
                    Already have an account? <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}