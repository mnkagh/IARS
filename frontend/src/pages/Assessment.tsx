import { useState, useMemo, useCallback } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { Slider3D } from '../components/three/Slider3D';
import { ScoreGauge, StatChip, GapBar } from '../components/three/ScoreGauge';
import { useTilt } from '../lib/hooks3d';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const DIMENSIONS = [
  'Teacher Training Level',
  'Policy Framework Clarity',
  'Technical Infrastructure',
  'Ethics Education Programs',
  'Institutional Support',
  'Budget Allocation',
  'Student AI Awareness',
  'Leadership Commitment',
];
const KEYS = ['teacherTraining','policyFramework','technicalInfra','ethicsEducation','institutionalSupport','budgetAllocation','studentAwareness','leadershipCommitment'] as const;
const WEIGHTS = [0.15,0.15,0.10,0.12,0.15,0.10,0.12,0.11];
const SHORT = ['Teacher Training','Policy Framework','Technical Infra','Ethics Education','Institutional Support','Budget','Student Awareness','Leadership'];

type Result = {
  weightedScore: number;
  rawAverage: number;
  status: string;
  statusLabel: string;
  statusDescription: string;
  gaps: { label: string; score: number; gap: number }[];
  recommendations: string[];
};

function localCalc(v: number[]): Result {
  const raw = Math.round(v.reduce((a, b) => a + b, 0) / 8);
  const w = Math.round(v.reduce((s, x, i) => s + x * WEIGHTS[i], 0));
  const st = w < 25 ? 'NOT_READY' : w < 50 ? 'EMERGING' : w < 75 ? 'MODERATE' : 'MATURE';
  const lb = w < 25 ? 'Not Ready' : w < 50 ? 'Emerging' : w < 75 ? 'Moderate' : 'Mature';
  const desc =
    w < 25 ? 'Build foundational policy and training before any AI deployment.' :
    w < 50 ? 'Governance exists but is thin — strengthen support structures.' :
    w < 75 ? 'Ready for phased implementation with targeted remediation.' :
    'Mature baseline — scale with fairness and bias auditing.';
  const gaps = DIMENSIONS.map((l, i) => ({ label: l, score: v[i], gap: 100 - v[i] })).sort((a, b) => b.gap - a.gap);
  const recs: string[] = [];
  if (w < 25) recs.push('Draft institutional AI policy framework', 'Launch teacher AI fundamentals training', 'Set ethics guidelines for student AI use');
  else if (w < 50) recs.push('Add implementation detail to existing policy', 'Expand teacher training to advanced topics', 'Formalise the ethics curriculum');
  else if (w < 75) recs.push('Pilot before scaling', 'Instrument adoption metrics', 'Add a continuous feedback loop');
  else recs.push('Scale institution-wide', 'Publish best-practice notes', 'Run recurring bias and fairness audits');
  gaps.slice(0, 2).forEach((g) => {
    if (g.score < 50) recs.push(`Priority: lift ${g.label} (${g.score}/100) — largest structural gap`);
  });
  return { weightedScore: w, rawAverage: raw, status: st, statusLabel: lb, statusDescription: desc, gaps, recommendations: recs };
}

export default function AssessmentPage() {
  const [values, setValues] = useState<number[]>([50, 45, 40, 55, 60, 35, 50, 65]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'warn' | 'err' } | null>(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const formTilt = useTilt(5);
  const resTilt = useTilt(7);

  const update = useCallback((i: number, v: number) => {
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    setResult(null);
    setMsg(null);
  }, []);

  const run = useCallback(async () => {
    const payload: Record<string, number> = {};
    KEYS.forEach((k, i) => (payload[k] = values[i]));
    try {
      const { data } = await api.post('/assessments/preview', payload);
      setResult(data.data);
      setMsg({ text: 'Scored by the IARS weighted model', kind: 'ok' });
    } catch {
      setResult(localCalc(values));
      setMsg({ text: 'API unreachable — scored locally, identical weights', kind: 'warn' });
    }
  }, [values]);

  const save = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBusy(true);
    const payload: Record<string, number> = {};
    KEYS.forEach((k, i) => (payload[k] = values[i]));
    try {
      await api.post('/assessments', payload);
      setMsg({ text: 'Saved to your assessment history', kind: 'ok' });
      setResult((r) => r ?? localCalc(values));
    } catch (e: any) {
      if (e.response?.status === 401) {
        navigate('/login');
      } else {
        setMsg({ text: e.response?.data?.error || 'Could not save assessment', kind: 'err' });
      }
    } finally {
      setBusy(false);
    }
  }, [values, isAuthenticated, navigate]);

  const exportPNG = useCallback(async () => {
    const el = document.getElementById('report');
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { backgroundColor: '#0f172a' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `IARS-report-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch {
      setMsg({ text: 'Export failed in this browser', kind: 'err' });
    }
  }, []);

  const chartData = useMemo(
    () => ({
      labels: SHORT,
      datasets: [
        {
          label: 'Institution',
          data: values,
          borderColor: '#a5b4fc',
          backgroundColor: 'rgba(129,140,248,.22)',
          borderWidth: 2,
          pointBackgroundColor: '#c7d2fe',
          pointRadius: 4,
          pointHoverRadius: 7,
        },
      ],
    }),
    [values]
  );

  const chartOpts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25, color: 'rgba(203,213,225,.5)', backdropColor: 'transparent' },
          grid: { color: 'rgba(148,163,184,.14)' },
          angleLines: { color: 'rgba(148,163,184,.14)' },
          pointLabels: { color: 'rgba(226,232,240,.82)', font: { size: 10 } },
        },
      },
      plugins: { legend: { labels: { color: '#cbd5e1' } } },
    }),
    []
  );

  const live = useMemo(() => localCalc(values), [values]);
  const shown = result ?? live;

  return (
    <div className="grid lg:grid-cols-2 gap-7">
      {/* ============ FORM ============ */}
      <div className="scene-3d">
        <div
          ref={formTilt.ref}
          onPointerMove={formTilt.onPointerMove}
          onPointerLeave={formTilt.onPointerLeave}
          className="card-3d t3d relative p-7"
        >
          <div className="t3d-edge" />
          <div className="t3d-glare" />

          <header className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📝</span>
              <h2 className="text-xl font-black text-white">Readiness Matrix</h2>
            </div>
            <p className="text-xs text-slate-400">Drag any dial · weights shown per dimension · results update live</p>
          </header>

          <div>
            {DIMENSIONS.map((label, i) => (
              <Slider3D
                key={label}
                index={i + 1}
                label={label}
                weight={WEIGHTS[i]}
                value={values[i]}
                onChange={(v) => update(i, v)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button className="btn-3d flex-1 min-w-[140px]" onClick={run}>
              ⚡ Compute Score
            </button>
            <button className="btn-3d btn-3d--ghost flex-1 min-w-[140px]" onClick={save} disabled={busy}>
              {isAuthenticated ? (busy ? '⏳ Saving…' : '💾 Save') : '🔒 Login to save'}
            </button>
            <button
              className="btn-3d btn-3d--ghost"
              onClick={() => {
                setValues([50, 45, 40, 55, 60, 35, 50, 65]);
                setResult(null);
                setMsg(null);
              }}
            >
              ↺ Reset
            </button>
          </div>

          {msg && (
            <p
              className="mt-4 text-xs px-4 py-2.5 rounded-xl border"
              style={{
                borderColor: msg.kind === 'ok' ? '#22c55e55' : msg.kind === 'warn' ? '#f59e0b55' : '#ef444455',
                background: msg.kind === 'ok' ? '#22c55e12' : msg.kind === 'warn' ? '#f59e0b12' : '#ef444412',
                color: msg.kind === 'ok' ? '#86efac' : msg.kind === 'warn' ? '#fcd34d' : '#fca5a5',
              }}
            >
              {msg.text}
            </p>
          )}
        </div>
      </div>

      {/* ============ RESULT ============ */}
      <div className="scene-3d">
        <div
          ref={resTilt.ref}
          onPointerMove={resTilt.onPointerMove}
          onPointerLeave={resTilt.onPointerLeave}
          className="card-3d t3d relative p-7"
        >
          <div className="t3d-edge" />
          <div className="t3d-glare" />

          <div id="report">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📈</span>
              <h2 className="text-xl font-black text-white">Institutional Readiness</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Weighted ML model · Σ (dimension × weight)</p>

            <ScoreGauge
              score={shown.weightedScore}
              status={shown.status}
              label={shown.statusLabel}
              sub={shown.statusDescription}
              size={196}
            />

            <div className="grid grid-cols-3 gap-3 my-7">
              <StatChip value={shown.rawAverage} label="Raw Mean" accent="#a5b4fc" />
              <StatChip value={shown.gaps[0]?.gap ?? 0} label="Top Gap" accent="#fca5a5" />
              <StatChip value={shown.recommendations.length} label="Actions" accent="#86efac" />
            </div>

            <div className="h-[230px] mb-6">
              <Radar data={chartData} options={chartOpts} />
            </div>

            <div className="mb-5">
              <h3 className="text-[11px] font-black uppercase tracking-[.2em] text-slate-300 mb-2">
                Gap Analysis
              </h3>
              <div className="space-y-0.5">
                {shown.gaps.map((g) => (
                  <GapBar key={g.label} label={g.label} gap={g.gap} score={g.score} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[.2em] text-slate-300 mb-2">
                Recommendations
              </h3>
              <ul className="space-y-1.5">
                {shown.recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[13px] text-slate-300 bg-white/[.03] border border-white/5 rounded-lg px-3 py-2 hover:border-[#667eea]/40 hover:text-white transition"
                  >
                    <span className="text-emerald-400 font-black">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-white/10">
            <button className="btn-3d btn-3d--ghost flex-1" onClick={exportPNG}>
              ⬇ Export PNG
            </button>
            <button className="btn-3d flex-1" onClick={() => navigate('/compare')}>
              ⚖️ Compare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}