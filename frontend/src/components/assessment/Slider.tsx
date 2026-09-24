interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  index: number;
}
export const DimensionSlider: React.FC<Props> = ({ label, value, onChange }) => {
  return (
    <div className="mb-5 p-4 bg-[#f8f9ff] rounded-xl border-l-4 border-[#667eea]">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        <span className="bg-[#667eea] text-white px-3 py-0.5 rounded-full text-xs font-bold">{value}</span>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ff6b6b 0%, #ffd93d 50%, #6bcf7f 100%)`,
          }}
        />
        <span className="font-bold text-[#667eea] min-w-[40px] text-right text-sm">{value}</span>
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  );
};
