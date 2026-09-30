import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTilt } from '../lib/hooks3d';

const STATUS_COLOR: Record<string, string> = {
  NOT_READY: '#ef4444',
  EMERGING: '#f59e0b',
  MODERATE: '#14b8a6',
  MATURE: '#22c55e',
};

export default function History() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const tilt = useTilt(5);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const r = await api.get(`/assessments?page=${page}&limit=10`);
      setData(r.data);
    } catch {
      setData(null);
    } finally {
      setBusy(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!window.confirm('Delete this assessment? This cannot be undone.')) return;
    await api.delete(`/assessments/${id}`);
    load();
  };

  const items: any[] = data?.items || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🗂️</span> Assessment History
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">
            {data ? `${data.total} records · owner-scoped via RBAC` : 'loading…'}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white/5 border border-white/10 p-1 text-[11px]">
          {(['table', 'cards'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg transition font-bold"
              style={{
                background: view === v ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent',
                color: view === v ? '#fff' : '#64748b',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {busy && <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden"><i className="block h-full w-1/3 bg-[#667eea] animate-pulse" /></div>}

      {!items.length ? (
        <div className="card-3d grid place-items-center py-20 text-center">
          <span className="text-5xl opacity-40">📭</span>
          <p className="mt-4 text-sm text-slate-400">Nothing recorded yet.</p>
          <Link to="/" className="btn-3d mt-5 !py-2.5 !px-5 !text-xs">
            Run your first assessment
          </Link>
        </div>
      ) : view === 'table' ? (
        <div className="scene-3d">
          <div
            ref={tilt.ref}
            onPointerMove={tilt.onPointerMove}
            onPointerLeave={tilt.onPointerLeave}
            className="card-3d t3d relative overflow-hidden"
          >
            <div className="t3d-edge" />
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[640px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[.16em] text-slate-500 border-b border-white/10">
                    <th className="text-left font-black px-5 py-3">Created</th>
                    <th className="font-black px-5 py-3">Score</th>
                    <th className="font-black px-5 py-3">Stage</th>
                    <th className="text-left font-black px-5 py-3">Institution</th>
                    <th className="font-black px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/[.03] transition">
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-black text-white text-base">{a.weightedScore}</span>
                        <span className="text-slate-600 text-[11px]"> /100</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide"
                          style={{ background: `${STATUS_COLOR[a.status]}22`, color: STATUS_COLOR[a.status] }}
                        >
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{a.institution?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => remove(a.id)}
                          className="text-[11px] font-bold text-slate-500 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition"
                        >
                          delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((a, i) => (
            <div
              key={a.id}
              className="card-3d t3d rise relative p-5"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="t3d-edge" />
              <div className="flex items-start justify-between">
                <span
                  className="text-3xl font-black"
                  style={{ color: STATUS_COLOR[a.status], textShadow: `0 0 24px ${STATUS_COLOR[a.status]}66` }}
                >
                  {a.weightedScore}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">{a.institution?.name || 'Unlinked institution'}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-black" style={{ color: STATUS_COLOR[a.status] }}>
                  {a.status.replace('_', ' ')}
                </span>
                <button onClick={() => remove(a.id)} className="text-[10px] text-slate-600 hover:text-red-300">
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-3d btn-3d--ghost !py-2 !px-4 !text-xs !rounded-xl !shadow-[0_6px_0_rgba(255,255,255,.07)]"
          >
            ← Prev
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            page {data.page} / {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-3d btn-3d--ghost !py-2 !px-4 !text-xs !rounded-xl !shadow-[0_6px_0_rgba(255,255,255,.07)]"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}