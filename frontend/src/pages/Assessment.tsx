import { useState } from 'react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { DimensionSlider } from '../components/assessment/Slider';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';

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

const KEYS = [
  'teacherTraining',
  'policyFramework',
  'technicalInfra',
  'ethicsEducation',
  'institutionalSupport',
  'budgetAllocation',
  'studentAwareness',
  'leadershipCommitment',
] as const;

type Result = {
  weightedScore: number;
  rawAverage: number;
  status: string;
  statusLabel: string;
  statusDescription: string;
  gaps: { label: string; score: number; gap: number }[];
  recommendations: string[];
};

export default function AssessmentPage() {
  const [values, setValues] = useState<number[]>(Array(8).fill(0));
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const update = (i: number, v: number) => {
    const copy = [...values];
    copy[i] = v;
    setValues(copy);
  };

  const calculate = async (save = false) => {
    setMsg('');
    const payload: any = {};
    KEYS.forEach((k, i) => (payload[k] = values[i]));

    try {
      if (save) {
        setSaving(true);
        const { data } = await api.post('/assessments', payload);
        setResult(data.data.computed);
        setMsg('✓ Assessment saved to your history');
      } else {
        const { data } = await api.post('/assessments/preview', payload);
        setResult(data.data);
      }
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Calculation failed. Are you logged in for saving? Try Preview without login.');
      // fallback to local calc if preview fails (offline)
      if (!save) {
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / 8);
        setResult({
          weightedScore: avg,
          rawAverage: avg,
          status: avg < 25 ? 'NOT_READY' : avg < 50 ? 'EMERGING' : avg < 75 ? 'MODERATE' : 'MATURE',
          statusLabel: avg < 25 ? 'Not Ready' : avg < 50 ? 'Emerging' : avg < 75 ? 'Moderate' : 'Mature',
          statusDescription: '',
          gaps: DIMENSIONS.map((l, i) => ({ label: l, score: values[i], gap: 100 - values[i] })).sort((a, b) => b.gap - a.gap),
          recommendations: ['Complete all dimensions and log in to get ML-powered recommendations'],
        });
      }
    } finally { setSaving(false); }
  };

  const reset = () => { setValues(Array(8).fill(0)); setResult(null); setMsg(''); };

  const statusColor = (s: string) => {
    if (s === 'NOT_READY') return 'text-red-500';
    if (s === 'EMERGING') return 'text-yellow-500';
    if (s === 'MODERATE') return 'text-teal-500';
    return 'text-green-500';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left */}
      <div className="bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-[#667eea] border-b-2 border-[#764ba2] pb-3 mb-4">Assessment Form</h2>
        <p className="text-sm text-gray-500 mb-4">Rate your institution on each dimension (0-100)</p>
        {DIMENSIONS.map((label, i) => (
          <DimensionSlider key={label} label={`${i + 1}. ${label}`} value={values[i]} onChange={(v) => update(i, v)} index={i} />
        ))}
        <div className="flex gap-3 mt-4">
          <Button onClick={() => calculate(false)} className="flex-1">Preview (No Login)</Button>
          <Button onClick={() => calculate(true)} className="flex-1" disabled={saving}>{saving ? 'Saving...' : 'Save Assessment'}</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
        </div>
        {msg && <p className="text-sm mt-3 text-center text-gray-600">{msg}</p>}
      </div>

      {/* Right */}
      <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-6">
        {!result ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-10">
            Complete the form and click Preview or Save to see results.<br />Login required to save history.
          </div>
        ) : (
          <>
            <div className="text-center p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl text-white">
              <h3 className="text-sm opacity-90 mb-3">INSTITUTIONAL READINESS SCORE</h3>
              <div className="w-36 h-36 rounded-full bg-white/20 border-4 border-white flex flex-col items-center justify-center mx-auto">
                <div className="text-5xl font-bold">{result.weightedScore}</div>
                <div className="text-sm">/100</div>
              </div>
              <div className={`mt-3 text-xl font-bold ${statusColor(result.status)} bg-white inline-block px-4 py-1 rounded-full`}>
                {result.statusLabel}
              </div>
              <p className="text-xs mt-2 opacity-90">{result.statusDescription}</p>
              <p className="text-xs mt-1 opacity-70">Raw Avg: {result.rawAverage} | Weighted ML Score: {result.weightedScore}</p>
            </div>

            <div className="h-[300px]">
              <Radar
                data={{
                  labels: DIMENSIONS,
                  datasets: [{ label: 'Score', data: values, borderColor: '#667eea', backgroundColor: 'rgba(102,126,234,0.15)', borderWidth: 2, pointBackgroundColor: '#667eea' }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } } }, plugins: { legend: { display: false } } }}
              />
            </div>

            <div className="bg-[#f8f9ff] p-4 rounded-xl">
              <h4 className="font-bold text-[#667eea] mb-3">📊 Gap Analysis</h4>
              {result.gaps.map((g) => (
                <div key={g.label} className="flex justify-between py-2 border-b last:border-0 text-sm">
                  <span>{g.label}</span><span className="bg-[#667eea] text-white px-3 py-0.5 rounded-full text-xs font-semibold">Gap: {g.gap}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#f0f9ff] p-4 rounded-xl border-l-4 border-[#667eea]">
              <h4 className="font-bold text-[#667eea] mb-2">💡 Recommendations</h4>
              {result.recommendations.map((r, i) => (
                <div key={i} className="flex gap-2 py-1 text-sm text-gray-600"><span className="text-green-500 font-bold">✓</span>{r}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
