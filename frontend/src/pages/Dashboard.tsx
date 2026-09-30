import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTilt } from '../lib/hooks3d';
import { StatChip } from '../components/three/ScoreGauge';

const STATUS_COLOR: Record<string, string> = {
  NOT_READY: '#ef4444',
  EMERGING: '#f59e0b',
  MODERATE: '#14b8a6',
  MATURE: '#22c55e',
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState('');
  const tilt = useTilt(6);

  useEffect(() => {
    api
      .get('/assessments/stats')
      .then((r) => setStats(r.data.data))
      .catch((e) => setErr(e.response?.status === 401 ? '' : 'Could not load analytics'));
  }, []);

  if (err) {
    return <div className="card-3d p-8 text-center text-sm text-slate-400">{err}</div>;
  }
  if (!stats) {
    return (
      <div className="grid md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-3d h-32 skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  const avg = stats.avg?._avg?.weightedScore ? Math.round(stats.avg._avg.weightedScore) : 0;
  const total = stats.byStatus?.reduce((s: number, x: any) => s + x._count.status, 0) || 0;
  const best = stats.byStatus?.find((s: any) => s.status === 'MATURE')?._count.status || 0;
  const recent: any[] = stats.recent || [];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-5">
        <div className="md:col-span-1">
          <StatChip value={stats.count} label="Assessments" accent="#a5b4fc" />
        </div>
        <StatChip value={avg} label="Mean Score" accent="#c084fc" />
        <StatChip value={best} label="Mature" accent="#4ade80" />
        <StatChip value={total} label="Classified" accent="#fbbf24" />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* trend */}
        <div className="scene-3d">
          <div
            ref={tilt.ref}
            onPointerMove={tilt.onPointerMove}
            onPointerLeave={tilt.onPointerLeave}
            className="card-3d t3d relative p-6 h-full"
          >
            <div className="t3d-edge" />
            <div className="t3d-glare" />
            <h2 className="text-sm font-black text-white mb-1">Score trajectory</h2>
            <p className="text-[11px] text-slate-500 mb-5">Most recent six submissions</p>

            {recent.length ? (
              <div className="flex items-end gap-3 h-44">
                {recent.map((r, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-black text-slate-300 opacity-0 group-hover:opacity-100 transition">
                      {Math.round(r.weightedScore)}
                    </span>
                    <div
                      className="w-full rounded-t-xl transition-all duration-500"
                      style={{
                        height: `${Math.max(4, r.weightedScore)}%`,
                        background: `linear-gradient(180deg, #a5b4fc, #764ba2)`,
                        boxShadow: '0 0 24px rgba(129,140,248,.35)',
                        transform: 'translateZ(14px)',
                      }}
                    />
                    <span className="text-[9px] text-slate-600 font-mono">
                      {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-44 grid place-items-center text-sm text-slate-500">
                No data yet —{' '}
                <Link to="/" className="text-[#a5b4fc] font-bold ml-1">
                  run an assessment
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* distribution */}
        <div className="card-3d relative p-6">
          <div className="t3d-edge" />
          <h2 className="text-sm font-black text-white mb-1">Readiness bands</h2>
          <p className="text-[11px] text-slate-500 mb-5">Distribution across four stages</p>
          <div className="space-y-3">
            {(['NOT_READY', 'EMERGING', 'MODERATE', 'MATURE'] as const).map((k) => {
              const n = stats.byStatus?.find((s: any) => s.status === k)?._count.status || 0;
              const pct = total ? (n / total) * 100 : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span style={{ color: STATUS_COLOR[k] }} className="font-bold">
                      {k.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-slate-400">
                      {n} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="bar3d">
                    <i style={{ width: `${pct}%`, background: STATUS_COLOR[k] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}