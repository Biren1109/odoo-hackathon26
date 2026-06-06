'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<any>(null);

    useEffect(() => {
        api.get(`/invoices/${id}`).then(r => setInvoice(r.data));
    }, [id]);

    const downloadPDF = async () => {
        try {
            const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoice.invoiceNumber}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { toast.error('PDF download failed'); }
    };

    const sendEmail = async () => {
        try {
            await api.post(`/invoices/${id}/send-email`);
            toast.success('Invoice sent via email!');
        } catch { toast.error('Email failed'); }
    };

    const updateStatus = async (status: string) => {
        await api.patch(`/invoices/${id}/status`, { status });
        setInvoice((prev: any) => ({ ...prev, status }));
        toast.success('Status updated');
    };

    if (!invoice) return <div className="p-8 text-slate-400">Loading...</div>;

    return (
        <div className="max-w-3xl" id="invoice-print">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <h1 className="text-2xl font-bold">Invoice: {invoice.invoiceNumber}</h1>
                <div className="flex gap-2">
                    <button onClick={downloadPDF} className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-100">⬇ Download PDF</button>
                    <button onClick={() => window.print()} className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-100">🖨 Print</button>
                    <button onClick={sendEmail} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">✉ Send Email</button>
                </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
                {/* Invoice Header */}
                <div className="flex justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-700">VendorBridge</h2>
                        <p className="text-sm text-slate-500">Procurement ERP</p>
                    </div>
                    <div className="text-right text-sm">
                        <p className="font-semibold text-lg">INVOICE</p>
                        <p className="text-slate-500"># {invoice.invoiceNumber}</p>
                        <p className="text-slate-500">Issued: {invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : '—'}</p>
                        <p className="text-slate-500">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {invoice.status}
                        </span>
                    </div>
                </div>

                {/* Vendor Info */}
                <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm">
                    <p className="font-semibold mb-1">Bill To</p>
                    <p>{invoice.vendor?.name}</p>
                    <p className="text-slate-500">{invoice.vendor?.address}</p>
                    <p className="text-slate-500">GST: {invoice.vendor?.gstNumber}</p>
                </div>

                {/* Line Items */}
                <table className="w-full text-sm mb-6">
                    <thead className="bg-slate-50"><tr><th className="text-left p-2">Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                    <tbody>
                        {invoice.items?.map((item: any) => (
                            <tr key={item.id} className="border-t">
                                <td className="py-2 px-2">{item.description}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-right">₹{item.unitPrice?.toLocaleString()}</td>
                                <td className="text-right">₹{item.totalPrice?.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Tax Breakdown */}
                <div className="border-t pt-4 text-sm space-y-1">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{invoice.subtotal?.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-600"><span>CGST (9%)</span><span>₹{invoice.cgst?.toLocaleString()}</span></div>
                    <div className="flex justify-between text-slate-600"><span>SGST (9%)</span><span>₹{invoice.sgst?.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                        <span>Total Amount</span><span>₹{invoice.totalAmount?.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Status Update */}
            <div className="mt-4 flex items-center gap-3 print:hidden">
                <span className="text-sm font-medium">Update Status:</span>
                {['DRAFT', 'ISSUED', 'PAID'].map(s => (
                    <button key={s} onClick={() => updateStatus(s)}
                        disabled={invoice.status === s}
                        className={`px-3 py-1.5 rounded text-xs border ${invoice.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-slate-100'}`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Print CSS */}
            <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
        </div>
    );
}