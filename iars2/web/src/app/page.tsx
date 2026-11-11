"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DIMS = [
  "Teacher Training Level",
  "Policy Framework Clarity",
  "Technical Infrastructure",
  "Ethics Education Programs",
  "Institutional Support",
  "Budget Allocation",
  "Student AI Awareness",
  "Leadership Commitment",
];

type DimensionDetail = {
  summary: string;
  why: string;
  low: string;
  high: string;
  evidence: string;
};

type Friction = {
  student_daily_use?: number;
  teacher_unaware?: number;
  student_hard_topics?: number;
  teacher_anxiety?: number;
  student_ethics?: number;
  teacher_willingness?: number;
  gap: number;
  risk: boolean;
};

type Analysis = {
  institution?: string;
  student?: { n: number; awareness: number; freq_daily_pct: number; hard_topics_pct: number; ethics_know_pct: number };
  teacher?: { n: number; unaware_pct: number; anxiety_pct: number; willingness_pct: number };
  dims: Record<string, number>;
  frictions?: { reality: Friction; value: Friction; governance: Friction };
  score: number;
  status: string;
  model_status: string;
  plan: { priority: string; title: string; dimension: string; why: string; evidence: string; action: string; owner: string; timeline: string }[];
  dimension_details: Record<string, DimensionDetail>;
};

type User = { email: string; name: string };

function Radar({ dims }: { dims: Record<string, number> }) {
  const n = DIMS.length;
  const cx = 150;
  const cy = 150;
  const r = 110;
  const pts = DIMS.map((d, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = (dims[d] || 0) / 100;
    return { x: cx + r * v * Math.cos(a), y: cy + r * v * Math.sin(a), label: d, lx: cx + (r + 18) * Math.cos(a), ly: cy + (r + 18) * Math.sin(a) };
  });
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const grid = [0.25, 0.5, 0.75, 1].map((s) => DIMS.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`;
  }).join(" "));
  return (
    <svg viewBox="0 0 300 300" className="mx-auto h-[300px] w-[300px]">
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />)}
      {DIMS.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="rgba(148,163,184,0.18)" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(0,240,255,0.12)" stroke="#00f0ff" strokeWidth="2" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00f0ff" />)}
      {pts.map((p, i) => <text key={`t${i}`} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#94a3b8">{p.label.split(" ")[0]}</text>)}
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"csv" | "manual">("csv");
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [teacherFile, setTeacherFile] = useState<File | null>(null);
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualDims, setManualDims] = useState<Record<string, number>>(Object.fromEntries(DIMS.map((d) => [d, 50])));
  const [manualData, setManualData] = useState<Analysis | null>(null);
  const [selectedDim, setSelectedDim] = useState<string | null>(null);
  const [selectedManualDim, setSelectedManualDim] = useState<string | null>(null);
  const [dimensionDetails, setDimensionDetails] = useState<Record<string, DimensionDetail> | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("iars_token");
    if (t) {
      setToken(t);
      fetch(`${API}/me`, { headers: { Authorization: `Bearer ${t}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d?.user) setUser(d.user); else { localStorage.removeItem("iars_token"); setToken(null); } })
        .catch(() => {});
    }
    fetch(`${API}/dimensions`).then((r) => r.ok ? r.json() : null).then((d) => { if (d) setDimensionDetails(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDim && !selectedManualDim) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-dimension-popover]")) return;
      if (target.closest("[data-dimension-trigger]")) return;
      setSelectedDim(null);
      setSelectedManualDim(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedDim, selectedManualDim]);

  function logout() {
    localStorage.removeItem("iars_token");
    setToken(null);
    setUser(null);
  }

  function clearAnalysis() {
    setData(null);
    setManualData(null);
    setSelectedDim(null);
    setSelectedManualDim(null);
    setError("");
  }

  async function analyze(useSample = false) {
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      if (!useSample) {
        if (!studentFile || !teacherFile) throw new Error("Select both files");
        form.append("student", studentFile);
        form.append("teacher", teacherFile);
      }
      const url = useSample ? `${API}/sample` : `${API}/analyze`;
      const res = await fetch(url, useSample ? {} : { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeManual() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dims: manualDims }),
      });
      if (!res.ok) throw new Error(await res.text());
      setManualData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport(format: "pdf" | "csv" | "docx", manual = false) {
    if (!token) { router.push("/auth"); return; }
    if (manual) {
      const res = await fetch(`${API}/report/manual/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dims: manualDims }),
      });
      if (!res.ok) { setError(await res.text()); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IARS_manual_report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    if (!studentFile || !teacherFile) return;
    const form = new FormData();
    form.append("student", studentFile);
    form.append("teacher", teacherFile);
    const res = await fetch(`${API}/report/${format}`, { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { setError(await res.text()); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IARS_detailed_report.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openDetailedAnalysis() {
    const active = mode === "manual" ? manualData : data;
    if (!active) return;
    sessionStorage.setItem("iars_analysis", JSON.stringify(active));
    router.push("/analysis");
  }

  const active = mode === "manual" ? manualData : data;
  const detailSource = active?.dimension_details || dimensionDetails;
  const selected = mode === "manual" ? selectedManualDim : selectedDim;

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IARS 2.0</h1>
            <p className="mt-2 text-slate-400">Dual-Perspective Alignment Engine — FastAPI + Next.js</p>
          </div>
          <div className="text-right">
            {user ? (
              <>
                <p className="text-sm text-slate-300">{user.name}</p>
                <button onClick={logout} className="mt-1 text-xs text-cyan-400">Sign out</button>
              </>
            ) : (
              <a href="/auth" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Sign in to download reports</a>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={() => setMode("csv")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "csv" ? "bg-cyan-500 text-black" : "border border-slate-700"}`}>CSV Analysis</button>
          <button onClick={() => setMode("manual")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "manual" ? "bg-cyan-500 text-black" : "border border-slate-700"}`}>Manual Scoring</button>
          <button onClick={clearAnalysis} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold">Clear analysis</button>
        </div>

        {mode === "csv" && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-widest text-cyan-400">Student Data</p>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setStudentFile(e.target.files?.[0] || null)} className="mt-3 w-full text-sm" />
                {studentFile && <p className="mt-2 text-xs text-slate-400">{studentFile.name}</p>}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-widest text-purple-400">Faculty Data</p>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setTeacherFile(e.target.files?.[0] || null)} className="mt-3 w-full text-sm" />
                {teacherFile && <p className="mt-2 text-xs text-slate-400">{teacherFile.name}</p>}
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => analyze(false)} disabled={loading || (!studentFile && !teacherFile)} className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
                {loading ? "Analyzing..." : "Analyze uploaded files"}
              </button>
              <button onClick={() => analyze(true)} disabled={loading} className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold disabled:opacity-50">
                Use bundled sample data
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Upload both files first, or use the bundled sample dataset.</p>
          </>
        )}

        {mode === "manual" && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-widest text-cyan-400">Manual Dimension Scoring</p>
            <p className="mt-2 text-sm text-slate-400">Click a dimension label to reveal its detailed explanation. Set each dimension from 0 to 100. No CSV required.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {DIMS.map((d) => (
                <div key={d} className="relative rounded-xl bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between">
                    <button data-dimension-trigger onClick={() => setSelectedManualDim(selectedManualDim === d ? null : d)} className="text-left text-sm text-slate-300 hover:text-cyan-400">
                      {d}
                    </button>
                    <span className="font-mono text-cyan-400">{manualDims[d]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={manualDims[d]}
                    onChange={(e) => setManualDims({ ...manualDims, [d]: Number(e.target.value) })}
                    className="mt-2 w-full"
                  />
                  {selectedManualDim === d && dimensionDetails?.[d] && (
                    <div data-dimension-popover className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
                      <p className="text-sm font-semibold text-cyan-400">{d}</p>
                      <p className="mt-2 text-sm text-slate-300">{dimensionDetails[d].summary}</p>
                      <p className="mt-3 text-xs text-slate-400"><span className="text-slate-200">Why it matters:</span> {dimensionDetails[d].why}</p>
                      <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">If low:</span> {dimensionDetails[d].low}</p>
                      <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">If high:</span> {dimensionDetails[d].high}</p>
                      <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">Evidence:</span> {dimensionDetails[d].evidence}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={analyzeManual} disabled={loading} className="mt-6 rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {loading ? "Scoring..." : "Compute score"}
            </button>
          </section>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {active && (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-400">Readiness</p>
                <p className="mt-2 text-3xl font-bold">{active.score.toFixed(1)}</p>
                <p className="mt-1 text-sm text-cyan-400">{active.status.replace("_", " ")}</p>
                <p className="mt-1 text-xs text-slate-500">ML: {active.model_status}</p>
              </div>
              {active.student && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Students</p>
                  <p className="mt-2 text-3xl font-bold">{active.student.n}</p>
                  <p className="mt-1 text-xs text-slate-500">Daily use {active.student.freq_daily_pct.toFixed(1)}%</p>
                </div>
              )}
              {active.teacher && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Faculty</p>
                  <p className="mt-2 text-3xl font-bold">{active.teacher.n}</p>
                  <p className="mt-1 text-xs text-slate-500">Unaware {active.teacher.unaware_pct.toFixed(1)}%</p>
                </div>
              )}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-400">Institution</p>
                <p className="mt-2 text-sm font-semibold">{active.institution || "Manual entry"}</p>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold">Dimension Scores</h2>
              <p className="mt-1 text-xs text-slate-500">Click a dimension for a detailed explanation.</p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  {DIMS.map((d) => (
                    <button
                      key={d}
                      data-dimension-trigger
                      onClick={() => setSelectedDim(selectedDim === d ? null : d)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${selectedDim === d ? "bg-cyan-500/10 border border-cyan-500/40" : "bg-slate-950/60 border border-transparent"}`}
                    >
                      <span className="text-sm text-slate-300">{d}</span>
                      <span className="font-mono text-sm">{active.dims[d].toFixed(1)}</span>
                    </button>
                  ))}
                </div>
                <Radar dims={active.dims} />
              </div>
              {selectedDim && detailSource?.[selectedDim] && (
                <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-cyan-400">{selectedDim}</p>
                  <p className="mt-2 text-sm text-slate-300">{detailSource[selectedDim].summary}</p>
                  <p className="mt-3 text-xs text-slate-400"><span className="text-slate-200">Why it matters:</span> {detailSource[selectedDim].why}</p>
                  <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">If low:</span> {detailSource[selectedDim].low}</p>
                  <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">If high:</span> {detailSource[selectedDim].high}</p>
                  <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">Evidence:</span> {detailSource[selectedDim].evidence}</p>
                </div>
              )}
            </section>

            {active.frictions && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <h2 className="text-lg font-semibold">Friction Index</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    ["Shadow AI Risk", active.frictions.reality, `Students daily use ${active.frictions.reality.student_daily_use!.toFixed(1)}% vs teachers unaware ${active.frictions.reality.teacher_unaware!.toFixed(1)}%`],
                    ["Pedagogical Misalignment", active.frictions.value, `Students use AI for hard topics ${active.frictions.value.student_hard_topics!.toFixed(1)}% vs teachers fear creativity loss ${active.frictions.value.teacher_anxiety!.toFixed(1)}%`],
                    ["Policy Vacuum", active.frictions.governance, `Students know full-generation is unethical ${active.frictions.governance.student_ethics!.toFixed(1)}% vs teachers support formal integration ${active.frictions.governance.teacher_willingness!.toFixed(1)}%`],
                  ].map(([title, f, detail]) => {
                    const fx = f as any;
                    return (
                      <div key={String(title)} className="rounded-xl bg-slate-950/60 p-4">
                        <p className="text-sm font-semibold">{title as string}</p>
                        <p className={`mt-2 text-2xl font-bold ${fx.risk ? "text-red-400" : "text-cyan-400"}`}>{fx.gap.toFixed(1)}</p>
                        <p className="mt-2 text-xs text-slate-400">{detail as string}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h2 className="text-lg font-semibold">Detailed Action Plan</h2>
              <div className="mt-4 space-y-4">
                {active.plan.map((a) => (
                  <div key={a.title} className="rounded-xl bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{a.title}</p>
                      <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">{a.priority}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{a.dimension} | Owner: {a.owner} | Timeline: {a.timeline}</p>
                    <p className="mt-2 text-sm text-slate-300">{a.why}</p>
                    <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">Evidence:</span> {a.evidence}</p>
                    <p className="mt-2 text-xs text-cyan-400"><span className="text-slate-200">Action:</span> {a.action}</p>
                  </div>
                ))}
              </div>
              {mode === "csv" && studentFile && teacherFile && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {token ? (
                    <>
                      <button onClick={() => downloadReport("pdf")} className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-black">Download PDF</button>
                      <button onClick={() => downloadReport("csv")} className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold">Download CSV</button>
                      <button onClick={() => downloadReport("docx")} className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold">Download DOCX</button>
                    </>
                  ) : (
                    <a href="/auth" className="rounded-xl border border-amber-500/40 px-5 py-2 text-sm font-semibold text-amber-400">Sign in to download detailed reports</a>
                  )}
                </div>
              )}
              {mode === "manual" && token && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => downloadReport("pdf", true)} className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-black">Download PDF</button>
                  <button onClick={() => downloadReport("csv", true)} className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold">Download CSV</button>
                  <button onClick={() => downloadReport("docx", true)} className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold">Download DOCX</button>
                </div>
              )}
              {mode === "manual" && !token && (
                <div className="mt-6">
                  <a href="/auth" className="rounded-xl border border-amber-500/40 px-5 py-2 text-sm font-semibold text-amber-400">Sign in to download detailed reports</a>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}





