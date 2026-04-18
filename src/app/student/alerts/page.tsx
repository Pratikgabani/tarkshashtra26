'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatRelativeDate, type StudentAlert } from '@/src/lib/studentDashboardClient';
import { AlertTriangle, Calendar, FileText, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

function Topbar({ title, subtitle, onMarkAllRead }: { title: string; subtitle?: string; onMarkAllRead: () => void }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <button onClick={onMarkAllRead} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
        Mark all as read
      </button>
    </div>
  );
}

export default function AlertsPage() {
  const [filter, setFilter] = useState('All');
  const [alerts, setAlerts] = useState<StudentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const response = await fetch('/api/student/alerts', { cache: 'no-store' });
        const json = await response.json();

        if (cancelled) return;

        if (response.ok && json?.success && json?.data) {
          setAlerts(Array.isArray(json.data.alerts) ? json.data.alerts : []);
          setError('');
          return;
        }

        setError(json?.message || 'Unable to load alerts.');
      } catch {
        if (!cancelled) {
          setError('Unable to load alerts.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadAlerts();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const filteredAlerts = useMemo(
    () => (filter === 'All' ? alerts : alerts.filter((alert) => alert.priority.toLowerCase() === filter.toLowerCase())),
    [alerts, filter]
  );

  async function handleToggleRead(alert: StudentAlert) {
    const makeRead = alert.status === 'unread';

    try {
      const response = await fetch(`/api/student/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: makeRead }),
      });

      if (!response.ok) return;

      setAlerts((prev) =>
        prev.map((item) =>
          item.id === alert.id
            ? {
                ...item,
                status: makeRead ? 'acknowledged' : 'unread',
              }
            : item
        )
      );
    } catch {
      // Keep existing state on network failure.
    }
  }

  async function handleMarkAllRead() {
    try {
      const response = await fetch('/api/student/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (!response.ok) return;

      setAlerts((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.status === 'unread' ? 'acknowledged' : item.status,
        }))
      );
    } catch {
      // Keep existing state on network failure.
    }
  }

  const getPriorityInfo = (priority: string) => {
    switch(priority.toLowerCase()) {
      case 'high': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'medium': return { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'low': return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
      default: return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#F8FAFC]">
      <Topbar
        title="Notifications & Alerts"
        subtitle="Stay updated on important events, risks, and messages"
        onMarkAllRead={() => {
          void handleMarkAllRead();
        }}
      />

      <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        
        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-4">
          {['All', 'High', 'Medium', 'Low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {loading && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-xs font-semibold">
            Loading alerts...
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs font-semibold">
            {error}
          </div>
        )}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-900">All Caught Up</h3>
              <p className="text-xs font-medium text-gray-500 mt-1">You do not have any {filter.toLowerCase()} notifications.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const { icon: Icon, color, bg, border } = getPriorityInfo(alert.priority);
              return (
                <div 
                  key={alert.id} 
                  className={`bg-white rounded-xl border p-5 flex gap-4 transition-all shadow-sm ${
                    alert.status !== 'unread' ? 'border-gray-200 opacity-75' : 'border-blue-200 ring-1 ring-blue-500/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border ${bg} ${border}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {alert.status === 'unread' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        <h3 className="text-sm font-bold text-gray-900">{alert.title}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-4">{formatRelativeDate(alert.sentAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{alert.message}</p>
                    
                    <div className="mt-4 flex items-center gap-3">
                      <Link href={alert.actionLink || '/student/profile'} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-md">
                        Take Action
                      </Link>
                      <button
                        className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                        onClick={() => void handleToggleRead(alert)}
                      >
                        {alert.status !== 'unread' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Circle className="w-3.5 h-3.5"/>}
                        {alert.status !== 'unread' ? 'Mark as unread' : 'Mark as read'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
}
