'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
    LayoutDashboard, Users, FileText, ClipboardList,
    CheckCircle, ShoppingCart, Receipt, Activity, BarChart2
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'] },
    { href: '/vendors', label: 'Vendors', icon: Users, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'] },
    { href: '/rfqs', label: 'RFQs', icon: FileText, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'] },
    { href: '/quotations', label: 'Quotations', icon: ClipboardList, roles: ['PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR'] },
    { href: '/approvals', label: 'Approvals', icon: CheckCircle, roles: ['MANAGER', 'PROCUREMENT_OFFICER'] },
    { href: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'] },
    { href: '/invoices', label: 'Invoices', icon: Receipt, roles: ['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER'] },
    { href: '/activity-logs', label: 'Activity Logs', icon: Activity, roles: ['ADMIN', 'MANAGER'] },
    { href: '/reports', label: 'Reports', icon: BarChart2, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT_OFFICER'] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthStore();

    const filtered = navItems.filter(item => user && item.roles.includes(user.role as string));

    return (
        <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col p-4">
            <div className="text-xl font-bold mb-8 text-indigo-400">VendorBridge</div>
            <nav className="flex flex-col gap-1">
                {filtered.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
              ${pathname.startsWith(href)
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                        <Icon size={18} />
                        {label}
                    </Link>
                ))}
            </nav>
        </aside>
    );
}