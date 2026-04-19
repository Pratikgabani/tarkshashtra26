'use client';

import { useEffect, useState } from 'react';

interface RemarkItem { id: string; text: string; followUpDate: string | null; createdAt: string; }
interface ActionItem { id: string; studentId: string; studentName: string; actionType: string; description: string; date: string; status: string; outcome: string; remarks: RemarkItem[]; }

function actionLabel(t: string) { return { counseling: 'Counseling', extra_class: 'Extra Class', academic_support: 'Academic Support', parent_meeting: 'Parent Meeting', peer_mentoring: 'Peer Mentoring', other: 'Other' }[t] || t; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function getUser() { const s = localStorage.getItem('shikshasetu_user'); return s ? JSON.parse(s) : null; }

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [remarkActionId, setRemarkActionId] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkFollowUp, setRemarkFollowUp] = useState('');

  const refreshActions = () => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  };

  useEffect(() => {
    const user = getUser();
    if (!user) { window.location.href = '/login'; return; }

    let isActive = true;

    (async () => {
      try {
        const res = await fetch('/api/mentor/actions');
        const json = await res.json();
        if (res.ok && isActive) setActions(json.data || []);
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

  async function updateStatus(id: string, status: string) {
    const user = getUser();
    if (!user) { window.location.assign('/login'); return; }
    await fetch('/api/mentor/actions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actionId: id, status }) });
    refreshActions();
  }

  async function addRemark() {
    const user = getUser();
    if (!user || !remarkText.trim() || !remarkActionId) return;
    const action = actions.find(a => a.id === remarkActionId);
    if (!action) return;
    await fetch('/api/mentor/remarks', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId: remarkActionId, studentId: action.studentId, text: remarkText, followUpDate: remarkFollowUp || undefined }) });
    setRemarkActionId(null); setRemarkText(''); setRemarkFollowUp('');
    refreshActions();
  }

  const filtered = filter === 'all' ? actions : actions.filter(a => a.status === filter);
  const counts = { all: actions.length, scheduled: actions.filter(a => a.status === 'scheduled').length, completed: actions.filter(a => a.status === 'completed').length, cancelled: actions.filter(a => a.status === 'cancelled').length };

  return (
    <div className="flex flex-col flex-1">
      <div className="app-topbar">
        <div>
          <h1 className="text-sm font-semibold text-[#111827]">Actions & Interventions</h1>
          <p className="text-xs text-[#6B7280]">Track all counseling sessions, extra classes, and follow-ups</p>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filter === f ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#2563EB]" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-xs text-[#6B7280]">No actions found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <div key={a.id} className="bg-white border border-[#E5E7EB] rounded-lg p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {a.actionType === 'counseling' ? '💬' : a.actionType === 'extra_class' ? '📚' : a.actionType === 'parent_meeting' ? '👨‍👩‍👦' : a.actionType === 'peer_mentoring' ? '🤝' : '🎯'}
                      </span>
                      <p className="text-sm font-semibold text-[#111827]">{actionLabel(a.actionType)}</p>
                      <span className="text-xs text-[#6B7280]">— {a.studentName}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">{a.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.status === 'scheduled' && (
                      <>
                        <button onClick={() => updateStatus(a.id, 'completed')} className="px-2.5 py-1 border border-green-200 text-green-700 bg-green-50 rounded text-[10px] font-semibold hover:bg-green-100">✓ Complete</button>
                        <button onClick={() => updateStatus(a.id, 'cancelled')} className="px-2.5 py-1 border border-gray-200 text-[#6B7280] bg-gray-50 rounded text-[10px] font-semibold hover:bg-gray-100">✗ Cancel</button>
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                      a.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      a.status === 'cancelled' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>{a.status}</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#6B7280]">{formatDate(a.date)}</p>
                {a.outcome && <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1.5">Outcome: {a.outcome}</p>}

                {a.remarks.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-gray-200 space-y-2">
                    <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Remarks & Follow-ups</p>
                    {a.remarks.map(r => (
                      <div key={r.id} className="bg-gray-50 rounded p-2.5">
                        <p className="text-xs text-[#111827]">{r.text}</p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">{formatDate(r.createdAt)}{r.followUpDate ? ` · Follow-up: ${formatDate(r.followUpDate)}` : ''}</p>
                      </div>
                    ))}
                  </div>
                )}

                {remarkActionId === a.id ? (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <textarea value={remarkText} onChange={e => setRemarkText(e.target.value)}
                      rows={2} className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB]" placeholder="Add remark…" />
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-[#6B7280]">Follow-up:</label>
                      <input type="date" value={remarkFollowUp} onChange={e => setRemarkFollowUp(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
                      <div className="ml-auto flex gap-2">
                        <button onClick={() => { setRemarkActionId(null); setRemarkText(''); }} className="px-2 py-1 text-[10px] border border-gray-200 rounded text-[#6B7280] hover:bg-gray-50">Cancel</button>
                        <button onClick={addRemark} disabled={!remarkText.trim()} className="px-3 py-1 text-[10px] font-semibold bg-[#2563EB] text-white rounded disabled:opacity-40">Save</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setRemarkActionId(a.id)} className="mt-2 text-[10px] font-medium text-[#2563EB] hover:underline">+ Add Remark</button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

