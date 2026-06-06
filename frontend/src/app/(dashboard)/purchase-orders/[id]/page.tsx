'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PODetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [po, setPO] = useState<any>(null);

    useEffect(() => {
        api.get(`/purchase-orders/${id}`).then(r => setPO(r.data));
    }, [id]);

    const generateInvoice = async () => {
        try {
            const res = await api.post('/invoices', { purchaseOrderId: id });
            toast.success('Invoice generated!');
            router.push(`/invoices/${res.data.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    if (!po) return <div className="p-8 text-slate-400">Loading...</div>;

    return (
        <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">PO: {po.poNumber}</h1>
                    <p className="text-slate-500 text-sm">{new Date(po.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={generateInvoice} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
                    Generate Invoice
                </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
                <h2 className="font-semibold mb-3">Vendor Details</h2>
                <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-slate-500">Name</p><p>{po.vendor?.name}</p></div>
                    <div><p className="text-slate-500">Email</p><p>{po.vendor?.email}</p></div>
                    <div><p className="text-slate-500">GST</p><p className="font-mono">{po.vendor?.gstNumber}</p></div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold mb-4">Items</h2>
                <table className="w-full text-sm">
                    <thead className="text-slate-500"><tr><th className="text-left pb-2">Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                    <tbody>
                        {po.items?.map((item: any) => (
                            <tr key={item.id} className="border-t">
                                <td className="py-2">{item.description}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-right">₹{item.unitPrice?.toLocaleString()}</td>
                                <td className="text-right">₹{item.totalPrice?.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="border-t mt-4 pt-4 space-y-1 text-sm text-right">
                    <p>Subtotal: ₹{po.subtotal?.toLocaleString()}</p>
                    <p>GST (18%): ₹{po.taxAmount?.toLocaleString()}</p>
                    <p className="font-bold text-base">Grand Total: ₹{po.grandTotal?.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}