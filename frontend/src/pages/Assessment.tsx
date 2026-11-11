import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { Rv } from '../lib/reveal';
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
const SHELF = ['EDU-01','EDU-02','EDU-03','EDU-04','EDU-05','EDU-06','EDU-07','EDU-08'];

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

function stored(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AssessmentPage() {
  const [values, setValues] = useState<number[]>([50, 45, 40, 55, 60, 35, 50, 65]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'analysis' | 'evidence' | 'notes'>('analysis');
  const [question, setQuestion] = useState(() => stored('iars-question', 'How ready is our institution for AI?'));
  const [notes, setNotes] = useState(() => stored('iars-notes', ''));
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'warn' | 'err' } | null>(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

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
      setTab('analysis');
    } catch {
      setResult(localCalc(values));
      setMsg({ text: 'API unreachable — scored locally, identical weights', kind: 'warn' });
      setTab('analysis');
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
      setMsg({ text: 'Filed to your archive', kind: 'ok' });
      setResult((r) => r ?? localCalc(values));
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { error?: string } } }).response?.status;
      const errText = (e as { response?: { data?: { error?: string } } }).response?.data?.error;
      if (status === 401) navigate('/login');
      else setMsg({ text: errText || 'Could not file assessment', kind: 'err' });
    } finally {
      setBusy(false);
    }
  }, [values, isAuthenticated, navigate]);

  const exportPNG = useCallback(async () => {
    const el = document.getElementById('report');
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { backgroundColor: '#fdfaf1' });
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
          borderColor: '#1e2c46',
          backgroundColor: 'rgba(61,90,128,.14)',
          borderWidth: 1.5,
          pointBackgroundColor: '#1e2c46',
          pointRadius: 2.5,
          pointHoverRadius: 5,
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
          ticks: { stepSize: 25, color: '#75705f', backdropColor: 'transparent', font: { size: 9, family: 'IBM Plex Mono' } },
          grid: { color: 'rgba(30,44,70,.14)' },
          angleLines: { color: 'rgba(30,44,70,.14)' },
          pointLabels: { color: '#2c3542', font: { size: 9, family: 'Space Grotesk' } },
        },
      },
      plugins: { legend: { labels: { color: '#2c3542', boxWidth: 10, font: { size: 10 } } } },
    }),
    []
  );

  const live = useMemo(() => localCalc(values), [values]);
  const shown = result ?? live;

  return (
    <Rv className="sheet">
      {/* research question */}
      <div className="px-6 md:px-9 pt-7">
        <p className="metaa">research question</p>
        <input
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value);
            try { localStorage.setItem('iars-question', e.target.value); } catch { /* private mode */ }
          }}
          aria-label="Research question"
          className="serif italic w-full bg-transparent outline-none text-navy mt-2 pb-3 rule-soft"
          style={{ fontSize: 'clamp(19px, 2.4vw, 27px)', borderTop: 0, borderLeft: 0, borderRight: 0 }}
        />
      </div>

      <div className="grid lg:grid-cols-2">
        {/* ============ FIELD NOTES ============ */}
        <div className="p-6 md:p-9 lg:border-r" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-baseline justify-between">
            <p className="metaa">field notes — eight dimensions</p>
            <span className="ref">Σ (d × w)</span>
          </div>

          <div className="mt-2">
            {DIMENSIONS.map((label, i) => (
              <div key={label} className="py-4 rule-soft first:border-t-0" style={{ borderTop: 0 }}>
                <div className="flex items-baseline justify-between gap-4 mb-1.5">
                  <p className="text-[14px] font-medium text-navy">
                    <span className="ref mr-3">{SHELF[i]}</span>
                    {label}
                  </p>
                  <p className="font-mono text-[11px] text-[#75705f] whitespace-nowrap">
                    w {WEIGHTS[i].toFixed(2)} · <strong className="text-navy">{values[i]}</strong>
                  </p>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={values[i]}
                  aria-label={`${label}, weight ${WEIGHTS[i].toFixed(2)}`}
                  onChange={(e) => update(i, parseInt(e.target.value, 10))}
                  className="cat-range"
                  style={{ '--fill': `${values[i]}%` } as CSSProperties}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-5">
            <button className="btn btn-navy flex-1 min-w-[150px]" onClick={run}>
              Compute reading <span className="arr">→</span>
            </button>
            <button className="btn btn-line flex-1 min-w-[150px]" onClick={save} disabled={busy}>
              {isAuthenticated ? (busy ? 'Filing…' : 'File to archive') : 'Sign in to file'}
            </button>
            <button
              className="btn btn-quiet"
              onClick={() => {
                setValues([50, 45, 40, 55, 60, 35, 50, 65]);
                setResult(null);
                setMsg(null);
              }}
            >
              Reset
            </button>
          </div>

          {msg && (
            <p
              className="mt-5 font-mono text-[11px] px-4 py-3"
              style={{
                border: '1px solid',
                borderColor: msg.kind === 'ok' ? 'rgba(126,144,112,.6)' : msg.kind === 'warn' ? 'rgba(195,154,43,.6)' : 'rgba(125,59,71,.6)',
                color: msg.kind === 'ok' ? '#5c7350' : msg.kind === 'warn' ? '#8a6d1c' : '#7d3b47',
              }}
              role="status"
            >
              {msg.text}
            </p>
          )}
        </div>

        {/* ============ ANALYSIS SHEETS ============ */}
        <div className="p-6 md:p-9" style={{ background: '#f8f3e6' }}>
          <div className="tabs" role="tablist" aria-label="Workspace sheets">
            {(['analysis', 'evidence', 'notes'] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          <div id="report" className="mt-6">
            {tab === 'analysis' && (
              <>
                <p className="metaa">reading — composite</p>
                <div className="flex items-start gap-5 mt-3">
                  <span className="tick mt-4" aria-hidden="true" />
                  <p className="serif font-medium leading-none text-navy" style={{ fontSize: 'clamp(84px, 9vw, 124px)' }}>
                    {shown.weightedScore}
                  </p>
                  <div className="pt-4">
                    <p className="font-mono text-[11px] text-[#75705f]">/ 100</p>
                    <p className="metaa mt-2" style={{ color: '#1e2c46' }}>{shown.statusLabel}</p>
                  </div>
                </div>
                <p className="text-[13.5px] leading-relaxed mt-3 max-w-sm text-inkbl">{shown.statusDescription}</p>
                <dl className="grid grid-cols-3 mt-6 pt-4 font-mono text-[11px] rule">
                  <div><dt className="metaa">raw mean</dt><dd className="text-xl text-navy mt-1">{shown.rawAverage}</dd></div>
                  <div><dt className="metaa">top gap</dt><dd className="text-xl text-navy mt-1">{shown.gaps[0]?.gap ?? 0}</dd></div>
                  <div><dt className="metaa">actions</dt><dd className="text-xl text-navy mt-1">{shown.recommendations.length}</dd></div>
                </dl>
              </>
            )}

            {tab === 'evidence' && (
              <>
                <p className="metaa">evidence — dimensional profile</p>
                <div className="h-[210px] mt-4">
                  <Radar data={chartData} options={chartOpts} />
                </div>
                <p className="caption mt-2">fig. — profile 0–100 · {question.slice(0, 60)}</p>
                <p className="metaa mt-7">gap ledger — ranked</p>
                <ol className="mt-2">
                  {shown.gaps.map((g, ri) => (
                    <li key={g.label} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-2.5 rule-soft">
                      <span className="font-mono text-[11px] text-[#a39c88]">{String(ri + 1).padStart(2, '0')}</span>
                      <span>
                        <span className="block text-[13px] text-navy">{g.label}</span>
                        <span className="meter mt-1.5 block">
                          <i style={{ width: `${g.gap}%` }} className={ri === 0 ? 'terra' : ''} />
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-inkbl" title={`Score ${g.score}`}>
                        {g.score}<span className="text-[#a39c88]"> /−{g.gap}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {tab === 'notes' && (
              <>
                <p className="metaa">research notes — prioritised</p>
                <ol className="mt-3 space-y-2.5">
                  {shown.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-3 items-start sheet-flat px-3 py-2.5">
                      <span className="font-mono text-[10px] text-[#75705f] pt-1">[{String(i + 1).padStart(2, '0')}]</span>
                      <span className="text-[13px] leading-relaxed text-inkbl">{r}</span>
                    </li>
                  ))}
                </ol>
                <p className="metaa mt-6">your margin note — kept in this browser</p>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    try { localStorage.setItem('iars-notes', e.target.value); } catch { /* private mode */ }
                  }}
                  rows={4}
                  placeholder="Continue your investigation…"
                  aria-label="Your research note"
                  className="field mt-2 serif italic"
                  style={{ fontSize: 15 }}
                />
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-7 pt-6 rule">
            <button className="btn btn-line flex-1 min-w-[150px]" onClick={exportPNG}>
              Export folio
            </button>
            <button className="btn btn-navy flex-1 min-w-[150px]" onClick={() => navigate('/compare')}>
              Compare <span className="arr">→</span>
            </button>
          </div>
        </div>
      </div>
    </Rv>
  );
}
