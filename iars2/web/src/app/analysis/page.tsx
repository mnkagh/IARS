"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DimensionDetail = { summary: string; why: string; low: string; high: string; evidence: string };
type Analysis = {
  institution?: string;
  score: number;
  status: string;
  model_status: string;
  dims: Record<string, number>;
  plan: { priority: string; title: string; dimension: string; why: string; evidence: string; action: string; owner: string; timeline: string }[];
  dimension_details: Record<string, DimensionDetail>;
  frictions?: any;
};

export default function AnalysisPage() {
  const router = useRouter();
  const [data, setData] = useState<Analysis | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("iars_token");
    if (!t) {
      router.push("/auth");
      return;
    }
    setToken(t);
    const raw = sessionStorage.getItem("iars_analysis");
    if (raw) setData(JSON.parse(raw));
  }, [router]);

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0b0f19] text-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-bold">Detailed Analysis</h1>
          <p className="mt-4 text-slate-400">No analysis found. Run an analysis first.</p>
          <a href="/" className="mt-6 inline-block text-cyan-400">Back to dashboard</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Detailed Analysis</h1>
            <p className="mt-2 text-slate-400">{data.institution || "Manual entry"} · {data.score.toFixed(1)}/100 · {data.status.replace("_", " ")}</p>
          </div>
          <a href="/" className="text-sm text-cyan-400">Back to dashboard</a>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Dimension Details</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(data.dims).map(([d, v]) => (
              <div key={d} className="rounded-xl bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{d}</p>
                  <span className="font-mono text-cyan-400">{v.toFixed(1)}</span>
                </div>
                {data.dimension_details[d] && (
                  <>
                    <p className="mt-2 text-sm text-slate-300">{data.dimension_details[d].summary}</p>
                    <p className="mt-2 text-xs text-slate-400"><span className="text-slate-200">Why:</span> {data.dimension_details[d].why}</p>
                    <p className="mt-1 text-xs text-slate-400"><span className="text-slate-200">If low:</span> {data.dimension_details[d].low}</p>
                    <p className="mt-1 text-xs text-slate-400"><span className="text-slate-200">If high:</span> {data.dimension_details[d].high}</p>
                    <p className="mt-1 text-xs text-slate-400"><span className="text-slate-200">Evidence:</span> {data.dimension_details[d].evidence}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Detailed Action Plan</h2>
          <div className="mt-4 space-y-4">
            {data.plan.map((a) => (
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
          {!token && <p className="mt-4 text-sm text-amber-400">Sign in to download detailed reports.</p>}
        </section>
      </div>
    </main>
  );
}