'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Bell, LogOut } from 'lucide-react';
import type { Notification } from '@/types';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showPanel, setShowPanel] = useState(false);

    useEffect(() => {
        api.get('/notifications').then(r => setNotifications(r.data.data || []));
    }, []);

    const unread = notifications.filter(n => !n.isRead).length;

    const markAllRead = async () => {
        await api.patch('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="h-14 bg-white border-b px-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">
                Welcome, <span className="font-semibold text-slate-800">{user?.firstName}</span>
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{user?.role}</span>
            </div>
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div className="relative">
                    <button onClick={() => setShowPanel(!showPanel)} className="relative p-2 hover:bg-slate-100 rounded-full">
                        <Bell size={20} />
                        {unread > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {unread}
                            </span>
                        )}
                    </button>
                    {showPanel && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                            <div className="flex justify-between items-center p-3 border-b">
                                <span className="font-semibold text-sm">Notifications</span>
                                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>
                            </div>
                            {notifications.length === 0
                                ? <p className="p-4 text-sm text-slate-400">No notifications</p>
                                : notifications.map(n => (
                                    <div key={n.id} className={`p-3 border-b text-sm ${!n.isRead ? 'bg-indigo-50' : ''}`}>
                                        <p className="font-medium">{n.title}</p>
                                        <p className="text-slate-500 text-xs">{n.message}</p>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
                {/* Logout */}
                <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-500">
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </header>
    );
}
