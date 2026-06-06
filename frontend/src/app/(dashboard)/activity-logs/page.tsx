'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ActivityLog } from '@/types';

const entityIcons: Record<string, string> = {
  VENDOR: '🏢', RFQ: '📄', QUOTATION: '💬', APPROVAL: '✅', PURCHASE_ORDER: '🛒', INVOICE: '🧾',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (reset = false) => {
    const p = reset ? 1 : page;
    const params = new URLSearchParams({ page: String(p), limit: '20' });
    if (entityType) params.set('entityType', entityType);
    const res = await api.get(`/activity-logs?${params}`);
    const newLogs = res.data.data || [];
    setLogs(prev => reset ? newLogs : [...prev, ...newLogs]);
    setHasMore(newLogs.length === 20);
    if (!reset) setPage(p + 1);
  };

  useEffect(() => { fetchLogs(true); setPage(2); }, [entityType]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Activity Logs</h1>
      <div className="flex gap-3 mb-6">
        <select value={entityType} onChange={e => setEntityType(e.target.value)} className="border rounded-lg p-2 text-sm">
          <option value="">All Types</option>
          {Object.keys(entityIcons).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {logs.map(log => (
          <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm flex gap-4">
            <div className="text-2xl">{entityIcons[log.entityType] || '📌'}</div>
            <div className="flex-1">
              <p className="text-sm font-medium">{log.action}</p>
              <p className="text-xs text-slate-500">
                by {log.actor?.firstName} {log.actor?.lastName} · {log.entityType} #{log.entityId.slice(0, 8)}
              </p>
              {log.details && <p className="text-xs text-slate-400 mt-1">{log.details}</p>}
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button onClick={() => fetchLogs(false)} className="mt-4 w-full border py-2 rounded-lg text-sm hover:bg-slate-100">
          Load More
        </button>
      )}
    </div>
  );
}