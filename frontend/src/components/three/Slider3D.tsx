const TICK_COLORS = ['#ef4444', '#f59e0b', '#14b8a6', '#22c55e'];

export function Slider3D({
  index,
  label,
  weight,
  value,
  onChange,
}: {
  index: number;
  label: string;
  weight: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const color = TICK_COLORS[Math.min(3, Math.floor(value / 25))];
  const band = Math.floor(value / 25);

  return (
    <div className="slider3d-stage mb-7">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[13px] font-semibold text-slate-200">
          <span className="text-[#667eea] font-black mr-1.5">{String(index).padStart(2, '0')}</span>
          {label}
        </span>
        <span className="text-[10px] font-mono text-slate-500">w {weight.toFixed(2)}</span>
      </div>

      <div className="slider3d relative">
        <div className="slider3d-track">
          <div
            className="slider3d-fill"
            style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }}
          />
          <div
            className="slider3d-knob"
            style={{ left: `calc(${value}% - 13px)` }}
          >
            <span
              className="slider3d-chip"
              style={{ left: '50%', transform: 'translateX(-50%) translateZ(0)' }}
            >
              {value}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            aria-label={label}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="slider3d-ticks">
          {Array.from({ length: 25 }).map((_, i) => (
            <b key={i} style={{ background: i <= band ? color : undefined, opacity: i <= band ? 0.85 : 0.18 }} />
          ))}
        </div>
      </div>
    </div>
  );
}