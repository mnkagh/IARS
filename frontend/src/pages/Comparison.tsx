import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../lib/api';
import { Rv } from '../lib/reveal';

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

/** Academic series — navy depths, terracotta for the fourth. */
const SERIES = ['rgba(30,44,70,.92)', 'rgba(61,90,128,.75)', 'rgba(126,144,112,.8)', 'rgba(178,102,63,.9)'];

export default function Comparison() {
  const [items, setItems] = useState<any[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

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
        backgroundColor: SERIES[ci % SERIES.length],
        borderWidth: 0,
      })),
    }),
    [chosen]
  );

  const opts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#2c3542', font: { size: 9, family: 'Space Grotesk' } }, grid: { color: 'rgba(30,44,70,.07)' } },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25, color: '#75705f', font: { size: 9, family: 'IBM Plex Mono' } },
          grid: { color: 'rgba(30,44,70,.09)' },
        },
      },
      plugins: {
        legend: { labels: { color: '#2c3542', boxWidth: 10, font: { size: 10 } } },
        tooltip: {
          backgroundColor: '#1e2c46',
          titleColor: '#fdfaf1',
          bodyColor: '#c3cbdb',
          borderWidth: 0,
          padding: 12,
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
      <Rv className="sheet-flat py-20 text-center">
        <p className="metaa">empty shelf</p>
        <p className="serif text-2xl text-navy mt-3">Nothing to compare yet.</p>
        <Link to="/" className="btn btn-navy mt-6">
          File a reading <span className="arr">→</span>
        </Link>
      </Rv>
    );
  }

  return (
    <div>
      <p className="metaa mb-5">select up to four readings — click to toggle</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {items.map((a, i) => {
          const on = sel.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggle(a.id)}
              aria-pressed={on}
              className="metaa px-4 py-2.5 transition-colors"
              style={{
                border: '1px solid',
                borderColor: on ? '#1e2c46' : 'var(--line)',
                background: on ? '#1e2c46' : 'transparent',
                color: on ? '#fdfaf1' : '#75705f',
              }}
            >
              {on ? '◆ ' : '◇ '}
              {a.institution?.name || a.user?.name || `Run #${i + 1}`} · {Math.round(a.weightedScore)}
            </button>
          );
        })}
      </div>

      <Rv className="sheet-flat p-6 md:p-8">
        <p className="metaa">dimensional overlay</p>
        {chosen.length ? (
          <div style={{ height: 380 }} className="mt-6">
            <Bar data={chart} options={opts} />
          </div>
        ) : (
          <p className="text-sm py-20 text-center text-inkbl">Select at least one reading</p>
        )}
      </Rv>

      {best && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
          {best.map((b, i) => (
            <Rv key={b.dim} delay={Math.min(i, 5) * 50} className="sheet-flat p-5">
              <p className="metaa">{b.dim}</p>
              <p className="serif text-4xl text-navy mt-2">{b.avg}</p>
              <div className="meter mt-4">
                <i style={{ width: `${b.avg}%` }} />
              </div>
              <p className="mt-3 font-mono text-[10px] truncate text-[#75705f]">lead — {b.leader}</p>
            </Rv>
          ))}
        </div>
      )}
    </div>
  );
}
