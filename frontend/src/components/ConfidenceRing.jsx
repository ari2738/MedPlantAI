/**
 * Animated circular confidence ring.
 * Green >80%, Amber 50-80%, Red <50%
 */
import { useEffect, useState } from "react";

export default function ConfidenceRing({ confidence = 0, size = 72 }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(confidence), 100);
    return () => clearTimeout(t);
  }, [confidence]);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  const color =
    confidence >= 80 ? "#16a34a"   // green-600
    : confidence >= 50 ? "#d97706" // amber-600
    : "#dc2626";                   // red-600

  const label =
    confidence >= 80 ? "High"
    : confidence >= 50 ? "Medium"
    : "Low";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={6}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}
        />
      </svg>
      {/* Center text — overlaid */}
      <div
        style={{ marginTop: -(size + 4), height: size }}
        className="flex flex-col items-center justify-center"
      >
        <span className="text-sm font-bold text-ink-900 leading-none">{confidence}%</span>
        <span className="text-[10px] text-ink-400 mt-0.5">{label}</span>
      </div>
    </div>
  );
}
