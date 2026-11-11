import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Rv } from '../lib/reveal';

const BAND: Record<string, string> = {
  NOT_READY: '#7d3b47',
  EMERGING: '#a88420',
  MODERATE: '#3d5a80',
  MATURE: '#5c7350',
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .get('/assessments/stats')
      .then((r) => setStats(r.data.data))
      .catch((e) => setErr(e.response?.status === 401 ? '' : 'Could not load analytics'));
  }, []);

  if (err) {
    return (
      <Rv className="sheet-flat p-10 text-center">
        <p className="metaa">{err}</p>
      </Rv>
    );
  }
  if (!stats) {
    return (
      <div className="grid md:grid-cols-4 sheet-flat" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-8 skel" style={{ borderRight: '1px solid var(--line)', minHeight: 120 }} />
        ))}
      </div>
    );
  }

  const avg = stats.avg?._avg?.weightedScore ? Math.round(stats.avg._avg.weightedScore) : 0;
  const total = stats.byStatus?.reduce((s: number, x: any) => s + x._count.status, 0) || 0;
  const best = stats.byStatus?.find((s: any) => s.status === 'MATURE')?._count.status || 0;
  const recent: any[] = stats.recent || [];
  const cells: [string, number][] = [
    ['Readings filed', stats.count],
    ['Mean score', avg],
    ['Mature', best],
    ['Classified', total],
  ];

  return (
    <div className="space-y-8">
      <Rv className="sheet-flat grid grid-cols-2 md:grid-cols-4">
        {cells.map(([label, v], i) => (
          <div key={label} className="p-6 md:p-8" style={{ borderRight: i < 3 ? '1px solid var(--line)' : undefined }}>
            <p className="metaa">{label}</p>
            <p className="serif text-5xl text-navy mt-2">{v}</p>
          </div>
        ))}
      </Rv>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <Rv className="sheet-flat p-6 md:p-8">
          <p className="metaa">score trajectory</p>
          <p className="caption mt-2">most recent six submissions</p>
          {recent.length ? (
            <div className="flex items-end gap-4 h-48 mt-8">
              {recent.map((r, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group">
                  <span className="font-mono text-[11px] opacity-0 group-hover:opacity-100 transition-opacity text-navy">
                    {Math.round(r.weightedScore)}
                  </span>
                  <div
                    className="w-full transition-all duration-500"
                    style={{ height: `${Math.max(4, r.weightedScore)}%`, background: '#1e2c46' }}
                    title={`${Math.round(r.weightedScore)} — ${new Date(r.createdAt).toLocaleDateString()}`}
                  />
                  <span className="font-mono text-[9px] text-[#a39c88]">
                    {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm py-16 text-center text-inkbl">
              No data yet —{' '}
              <Link to="/" className="underline underline-offset-4 text-navy">
                run an assessment
              </Link>
            </p>
          )}
        </Rv>

        <Rv delay={90} className="sheet-flat p-6 md:p-8">
          <p className="metaa">readiness bands</p>
          <p className="caption mt-2">distribution · four stages</p>
          <div className="mt-6 space-y-5">
            {(['NOT_READY', 'EMERGING', 'MODERATE', 'MATURE'] as const).map((k) => {
              const n = stats.byStatus?.find((s: any) => s.status === k)?._count.status || 0;
              const pct = total ? (n / total) * 100 : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between font-mono text-[11px] mb-2">
                    <span style={{ color: BAND[k] }}>{k.replace('_', ' ')}</span>
                    <span className="text-[#75705f]">
                      {n} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="meter">
                    <i style={{ width: `${pct}%`, background: BAND[k] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Rv>
      </div>
    </div>
  );
}
