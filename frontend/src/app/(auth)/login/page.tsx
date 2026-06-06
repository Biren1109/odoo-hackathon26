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
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Min 8 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            const res = await api.post('/auth/login', data);
            const { user, accessToken } = res.data;
            setAuth(user, accessToken);
            toast.success('Logged in!');
            // Role-based redirect
            if (user.role === 'MANAGER') router.push('/approvals');
            else if (user.role === 'VENDOR') router.push('/rfqs');
            else router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">VendorBridge</h1>
                <p className="text-slate-500 mb-6">Sign in to your account</p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <input {...register('email')} className="w-full border rounded-lg p-2 mt-1 text-sm" placeholder="you@company.com" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <input {...register('password')} type="password" className="w-full border rounded-lg p-2 mt-1 text-sm" />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>
                    <button type="submit" disabled={isSubmitting}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div className="mt-4 text-sm text-center space-y-1">
                    <Link href="/forgot-password" className="text-indigo-600 hover:underline block">Forgot Password?</Link>
                    <Link href="/signup" className="text-slate-500 hover:underline block">Don't have an account? Sign up</Link>
                </div>
            </div>
        </div>
    );
}