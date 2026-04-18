'use client';

import { useEffect, useState } from 'react';

interface AlertItem {
  id: string; studentId: string; studentName: string; type: string; priority: string;
  title: string; message: string; status: string; sentAt: string;
}

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function getUser() { const s = localStorage.getItem('shikshasetu_user'); return s ? JSON.parse(s) : null; }

function priorityStyle(p: string) {
  if (p === 'critical') return 'border-l-red-500 bg-red-50/30';
  if (p === 'high') return 'border-l-orange-500 bg-orange-50/30';
  if (p === 'medium') return 'border-l-yellow-500';
  return 'border-l-blue-500';
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged'>('all');

  const refreshAlerts = () => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  };

  useEffect(() => {
    const user = getUser();
    if (!user) { window.location.href = '/login'; return; }

    let isActive = true;

    (async () => {
      try {
        const res = await fetch(`/api/mentor/alerts?mentorId=${user.id}`);
        const json = await res.json();
        if (res.ok && isActive) setAlerts(json.data || []);
      } catch {
        /* ignore */
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  async function acknowledge(id: string) {
    const user = getUser();
    if (!user) { window.location.assign('/login'); return; }
    await fetch('/api/mentor/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId: id, mentorId: user.id, status: 'acknowledged' }) });
    refreshAlerts();
  }

  async function acknowledgeAll() {
    const user = getUser();
    if (!user) { window.location.assign('/login'); return; }
    const unread = alerts.filter(a => a.status === 'unread');
    await Promise.all(unread.map(a => fetch('/api/mentor/alerts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId: a.id, mentorId: user.id, status: 'acknowledged' }) })));
    refreshAlerts();
  }

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status === filter);
  const unreadCount = alerts.filter(a => a.status === 'unread').length;

  return (
    <div className="flex flex-col flex-1">
      <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-[#111827]">Alerts & Notifications</h1>
          <p className="text-xs text-[#6B7280]">{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={acknowledgeAll} className="px-3 py-1.5 border border-[#E5E7EB] rounded text-xs font-medium text-[#6B7280] hover:bg-gray-50 transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'unread', 'acknowledged'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === f ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#2563EB]" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 mb-3 text-2xl">🎉</div>
            <p className="text-sm font-medium text-[#111827]">All caught up!</p>
            <p className="text-xs text-[#6B7280]">No alerts to show.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(a => (
              <div key={a.id} className={`bg-white border border-[#E5E7EB] border-l-[3px] rounded-lg p-4 ${priorityStyle(a.priority)} ${a.status === 'unread' ? '' : 'opacity-80'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#111827]">{a.title}</p>
                      {a.status === 'unread' && <span className="h-2 w-2 rounded-full bg-[#2563EB] shrink-0" />}
                    </div>
                    <p className="text-xs text-[#6B7280] leading-relaxed">{a.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-[#6B7280]">{formatDate(a.sentAt)}</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                        a.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                        a.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        a.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>{a.priority}</span>
                      <span className="text-[10px] text-[#6B7280]">{a.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  {a.status === 'unread' && (
                    <button onClick={() => acknowledge(a.id)}
                      className="shrink-0 px-3 py-1.5 border border-[#2563EB] text-[#2563EB] rounded text-xs font-medium hover:bg-[#2563EB] hover:text-white transition-colors">
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
