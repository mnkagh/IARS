import { useCountUp } from '../../lib/hooks3d';

const META: Record<string, { label: string; color: string; glow: string; ring: string }> = {
  NOT_READY: { label: 'Not Ready', color: '#fca5a5', glow: 'rgba(239,68,68,.5)', ring: '#ef4444' },
  EMERGING: { label: 'Emerging', color: '#fcd34d', glow: 'rgba(245,158,11,.5)', ring: '#f59e0b' },
  MODERATE: { label: 'Moderate', color: '#5eead4', glow: 'rgba(20,184,166,.5)', ring: '#14b8a6' },
  MATURE: { label: 'Mature', color: '#86efac', glow: 'rgba(34,197,94,.5)', ring: '#22c55e' },
};

export function ScoreGauge({
  score,
  status,
  label,
  size = 210,
  sub,
}: {
  score: number;
  status: string;
  label: string;
  size?: number;
  sub?: string;
}) {
  const n = useCountUp(score);
  const meta = META[status] || META.MODERATE;
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="gauge-shell preserve" style={{ width: size, height: size, margin: '0 auto' }}>
      <div className="gauge-depth" />
      <div className="gauge-ring" style={{ boxShadow: `0 0 60px ${meta.glow}, inset 0 0 40px rgba(255,255,255,.14)` }} />
      <div className="gauge-mask" style={{ ['--p' as string]: `${pct * 3.6}deg` }} />
      <div className="gauge-hole">
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <span className="text-5xl font-black neon-text" style={{ color: meta.color }}>
            {n}
          </span>
          <span className="text-[11px] uppercase tracking-[.24em] text-slate-400">of 100</span>
          <span
            className="mt-1 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{ background: meta.ring, color: '#fff', boxShadow: `0 4px 16px ${meta.glow}` }}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="gauge-needle" style={{ ['--a' as string]: `${pct * 1.8 - 90}deg` }} />
      <div className="gauge-cap" />
      {sub && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-max max-w-[280px] text-center text-xs text-slate-300">
          {sub}
        </div>
      )}
    </div>
  );
}

export function StatChip({ value, label, accent = '#667eea' }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="card-3d px-5 py-4 text-center relative overflow-hidden">
      <div className="t3d-edge" />
      <div className="t3d-shift">
        <div className="text-3xl font-black" style={{ color: accent, textShadow: `0 0 22px ${accent}55` }}>
          {value}
        </div>
        <div className="text-[11px] uppercase tracking-[.18em] text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  );
}

export function GapBar({ label, gap, score }: { label: string; gap: number; score: number }) {
  const tilt = Math.min(14, gap / 6);
  return (
    <div className="group flex items-center gap-3 py-1.5">
      <span className="text-[12px] text-slate-300 w-[150px] shrink-0 group-hover:text-white transition">
        {label}
      </span>
      <div className="bar3d flex-1">
        <i style={{ width: `${gap}%` }} />
      </div>
      <span
        className="text-[11px] font-bold w-12 text-right rounded-md px-1.5 py-0.5"
        style={{ background: `rgba(239,68,68,${0.12 + tilt / 40})`, color: '#fca5a5', transform: `translateZ(${tilt}px)` }}
        title={`Score ${score} · Gap ${gap}`}
      >
        {gap}
      </span>
    </div>
  );
}