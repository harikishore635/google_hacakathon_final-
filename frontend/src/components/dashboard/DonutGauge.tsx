"use client";

import { useEffect, useRef, useState } from "react";

interface DonutGaugeProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
}

export default function DonutGauge({
  value,
  size = 120,
  strokeWidth = 12,
  color = "#FF6B35",
  label,
  showValue = true,
}: DonutGaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--dash-gauge-track, #E5E7EB)"
          strokeWidth={strokeWidth}
        />
        {/* Value arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={inView ? offset : circumference}
          style={{ transition: "stroke-dashoffset 1.5s ease" }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-heading">{value}%</span>
          {label && <span className="text-[10px] text-label">{label}</span>}
        </div>
      )}
    </div>
  );
}
