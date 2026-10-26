interface SpectrumBarProps {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}

/**
 * Read-only visual indicator showing where a kite sits on a 0–100 spectrum.
 * Mirrors the styling of the interactive `<input type="range">` sliders used
 * on the homepage / browse / compare pages so detail-page bars match the rest of the site.
 */
export default function SpectrumBar({ label, value, leftLabel, rightLabel }: SpectrumBarProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-semibold text-slate">{label}</p>}
      <div className="relative pt-2 pb-1">
        {/* Track — matches input[type=range] in globals.css */}
        <div className="relative h-1 bg-gray-200">
          <div
            className="absolute inset-y-0 left-0 bg-ocean"
            style={{ width: `${v}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 h-5 w-2 -translate-y-1/2 bg-ocean"
            style={{ left: `calc(${v}% - 10px)` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">{leftLabel}</span>
          <span className="text-xs text-gray-500">{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}
