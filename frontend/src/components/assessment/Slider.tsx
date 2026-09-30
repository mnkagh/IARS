interface Props { label: string; value: number; onChange: (v: number) => void }
export const DimensionSlider: React.FC<Props> = ({ label, value, onChange }) => {
  const pct = value;
  const color = pct < 33 ? '#ef4444' : pct < 66 ? '#eab308' : '#22c55e';
  return (
    <div className="mb-5 p-4 bg-slate-800/50 rounded-xl border-l-4 border-[#667eea]">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-slate-300 text-sm">{label}</span>
        <span className="bg-[#667eea]/30 text-white px-3 py-0.5 rounded-full text-xs font-bold">{value}</span>
      </div>
      <div className="flex items-center gap-4">
        <input type="range" min={0} max={100} value={value} onChange={e=>onChange(parseInt(e.target.value))}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }} />
        <span className="font-bold text-[#667eea] min-w-[40px] text-right text-sm">{value}</span>
      </div>
    </div>
  );
};
