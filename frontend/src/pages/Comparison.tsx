import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../lib/api';
import { useTilt } from '../lib/hooks3d';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DIMS = [
  'Teacher Training',
  'Policy Framework',
  'Technical Infra',
  'Ethics Education',
  'Institutional Support',
  'Budget',
  'Student Awareness',
  'Leadership',
];
const FIELDS = [
  'teacherTraining',
  'policyFramework',
  'technicalInfra',
  'ethicsEducation',
  'institutionalSupport',
  'budgetAllocation',
  'studentAwareness',
  'leadershipCommitment',
];

const PALETTE = ['#667eea', '#764ba2', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#06b6d4'];

export default function Comparison() {
  const [items, setItems] = useState<any[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const tilt = useTilt(5);

  useEffect(() => {
    api
      .get('/assessments?limit=10')
      .then((r) => setItems(r.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    setSel(items.slice(0, 3).map((i) => i.id));
  }, [items]);

  const chosen = useMemo(() => items.filter((i) => sel.includes(i.id)), [items, sel]);

  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]));

  const chart = useMemo(
    () => ({
      labels: DIMS,
      datasets: chosen.map((a, ci) => ({
        label: `${a.institution?.name || 'Assessment'} · ${Math.round(a.weightedScore)}`,
        data: FIELDS.map((f) => a[f] ?? 0),
        backgroundColor: `${PALETTE[ci % PALETTE.length]}bb`,
        borderColor: PALETTE[ci % PALETTE.length],
        borderWidth: 1,
        borderRadius: 6,
      })),
    }),
    [chosen]
  );

  const opts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: 'rgba(203,213,225,.7)', font: { size: 10 } }, grid: { color: 'rgba(148,163,184,.08)' } },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25, color: 'rgba(203,213,225,.55)' },
          grid: { color: 'rgba(148,163,184,.12)' },
        },
      },
      plugins: {
        legend: { labels: { color: '#cbd5e1', boxWidth: 12, font: { size: 10 } } },
        tooltip: {
          backgroundColor: 'rgba(2,6,23,.95)',
          borderColor: 'rgba(102,126,234,.4)',
          borderWidth: 1,
          titleColor: '#fff',
          bodyColor: '#cbd5e1',
        },
      },
    }),
    []
  );

  const best = useMemo(() => {
    if (!chosen.length) return null;
    return DIMS.map((d, di) => {
      const scores = chosen.map((a) => a[FIELDS[di]] ?? 0);
      const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
      const leader = chosen[scores.indexOf(Math.max(...scores))];
      return { dim: d, avg: Math.round(avg), leader: leader?.institution?.name || 'Assessment' };
    });
  }, [chosen]);

  if (loaded && !items.length) {
    return (
      <div className="card-3d grid place-items-center py-20 text-center">
        <span className="text-5xl opacity-40">🗃️</span>
        <p className="mt-4 text-sm text-slate-400">No assessments available to compare.</p>
        <Link to="/" className="btn-3d mt-5 !py-2.5 !px-5 !text-xs">
          Create one
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <span>⚖️</span> Dimensional Comparison
        </h1>
        <p className="text-[11px] text-slate-500 mt-1">Select up to four assessments · click a row to toggle</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((a, i) => {
          const on = sel.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggle(a.id)}
              className="px-3 py-2 rounded-xl text-[11px] font-bold transition border"
              style={{
                background: on ? `${PALETTE[i % PALETTE.length]}22` : 'rgba(255,255,255,.03)',
                borderColor: on ? `${PALETTE[i % PALETTE.length]}88` : 'rgba(255,255,255,.08)',
                color: on ? '#fff' : '#64748b',
              }}
            >
              {on ? '✓ ' : ''}
              {a.institution?.name || a.user?.name || `Run #${i + 1}`} · {Math.round(a.weightedScore)}
            </button>
          );
        })}
      </div>

      <div className="scene-3d">
        <div
          ref={tilt.ref}
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
          className="card-3d t3d relative p-6"
        >
          <div className="t3d-edge" />
          <div className="t3d-glare" />
          {chosen.length ? (
            <div style={{ height: 380 }}>
              <Bar data={chart} options={opts} />
            </div>
          ) : (
            <div className="h-64 grid place-items-center text-sm text-slate-500">
              Select at least one assessment
            </div>
          )}
        </div>
      </div>

      {best && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {best.map((b, i) => (
            <div
              key={b.dim}
              className="card-3d relative p-4 rise"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="t3d-edge" />
              <p className="text-[10px] uppercase tracking-[.16em] text-slate-500">{b.dim}</p>
              <p className="text-2xl font-black text-white mt-1.5">{b.avg}</p>
              <div className="bar3d mt-2.5">
                <i style={{ width: `${b.avg}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-slate-500 truncate">lead: {b.leader}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}