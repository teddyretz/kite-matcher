interface SpectrumBarProps {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}

/**
 * Read-only visual indicator showing where a kite sits on a 0–100 spectrum.
 * Mirrors the styling of the interactive `<input type="range">` sliders used
 * on the homepage / browse / compare pages (4px track, cyan fill up to value,
 * ocean thumb with glow) so detail-page bars match the rest of the site.
 */
export default function SpectrumBar({ label, value, leftLabel, rightLabel }: SpectrumBarProps) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-semibold text-slate">{label}</p>}
      <div className="relative pt-2 pb-1">
        {/* Track — matches input[type=range] in globals.css */}
        <div className="h-1 rounded-full bg-[#1A2535] relative">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ocean"
            style={{ width: `${v}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-ocean border-[3px] border-surface shadow-[0_0_10px_rgba(0,229,255,0.5)]"
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
