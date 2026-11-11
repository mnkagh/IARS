import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Rv } from '../lib/reveal';

const BAND: Record<string, string> = {
  NOT_READY: '#7d3b47',
  EMERGING: '#a88420',
  MODERATE: '#3d5a80',
  MATURE: '#5c7350',
};

export default function History() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'table' | 'cards'>('table');

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
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <p className="font-mono text-[11px] text-[#75705f]">
          {data ? `${data.total} records · owner-scoped via RBAC` : 'retrieving…'}
        </p>
        <div className="tabs" role="tablist" aria-label="View">
          {(['table', 'cards'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {busy && (
        <div className="h-px w-full mb-6 rule" aria-hidden="true">
          <i className="block h-full w-1/3 skel" />
        </div>
      )}

      {!items.length ? (
        <Rv className="sheet-flat py-20 text-center">
          <p className="metaa">empty shelf</p>
          <p className="serif text-2xl text-navy mt-3">Nothing filed yet.</p>
          <Link to="/" className="btn btn-navy mt-6">
            Run the first reading <span className="arr">→</span>
          </Link>
        </Rv>
      ) : view === 'table' ? (
        <Rv className="sheet-flat overflow-x-auto">
          <table className="acad-table min-w-[640px]">
            <thead>
              <tr>
                <th>Created</th>
                <th>Score</th>
                <th>Stage</th>
                <th>Institution</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="arch-row">
                  <td className="font-mono text-[11px] text-[#75705f]">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span className="serif text-2xl text-navy">{a.weightedScore}</span>
                    <span className="font-mono text-[10px] text-[#a39c88]"> /100</span>
                  </td>
                  <td>
                    <span className="metaa" style={{ color: BAND[a.status] ?? '#1e2c46' }}>
                      {a.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-[13px] text-inkbl">{a.institution?.name || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => remove(a.id)} className="metaa hover:text-navy transition-colors">
                      delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Rv>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((a, i) => (
            <Rv key={a.id} delay={Math.min(i, 5) * 50} className="sheet-flat p-6">
              <div className="flex items-start justify-between">
                <span className="serif text-5xl text-navy">{a.weightedScore}</span>
                <span className="font-mono text-[10px] text-[#a39c88]">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[12px] mt-3 text-inkbl">{a.institution?.name || 'Unlinked institution'}</p>
              <div className="flex items-center justify-between mt-5 pt-4 rule">
                <span className="metaa" style={{ color: BAND[a.status] ?? '#1e2c46' }}>
                  {a.status.replace('_', ' ')}
                </span>
                <button onClick={() => remove(a.id)} className="metaa hover:text-navy transition-colors">
                  delete
                </button>
              </div>
            </Rv>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-line">
            ← Prev
          </button>
          <span className="font-mono text-[11px] text-[#75705f]">
            folio {data.page} / {data.totalPages}
          </span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-line">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
