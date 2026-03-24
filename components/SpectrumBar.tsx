interface SpectrumBarProps {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}

export default function SpectrumBar({ label, value, leftLabel, rightLabel }: SpectrumBarProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate">{label}</p>
      <div className="relative">
        <div className="h-3 bg-gradient-to-r from-ocean/20 via-sand/30 to-ocean/20 rounded-full">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-ocean rounded-full border-2 border-white shadow-md"
            style={{ left: `calc(${value}% - 10px)` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{leftLabel}</span>
          <span className="text-xs text-gray-500">{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}
