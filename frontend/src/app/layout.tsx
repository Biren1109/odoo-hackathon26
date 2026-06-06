import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VendorBridge — Procurement ERP',
  description: 'Procurement & Vendor Management ERP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}