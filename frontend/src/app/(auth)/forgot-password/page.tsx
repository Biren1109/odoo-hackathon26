'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast.success('Reset link sent to your email!');
        } catch {
            toast.error('Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password</h1>
                <p className="text-slate-500 mb-6">Enter your email to receive a reset link.</p>
                {sent ? (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                        ✅ Reset link sent! Check your inbox.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            required placeholder="you@company.com"
                            className="input mt-0"
                        />
                        <button type="submit" disabled={loading}
                            className="w-full btn-primary py-2.5">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
                <p className="mt-4 text-sm text-center">
                    <Link href="/login" className="text-indigo-600 hover:underline">← Back to Login</Link>
                </p>
            </div>
        </div>
    );
}