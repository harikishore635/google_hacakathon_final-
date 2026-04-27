"use client";

import { useEffect, useState, useRef } from "react";

interface ArcGaugeProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  label?: string;
}

export default function ArcGauge({
  value,
  size = 80,
  strokeWidth = 8,
  color = "#FF6B35",
  gradientFrom,
  gradientTo,
  label,
}: ArcGaugeProps) {
  const ref = useRef<SVGCircleElement>(null);
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference - (value / 100) * circumference;
  const gradientId = `arc-${Math.random().toString(36).slice(2, 8)}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setAnimated(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative inline-flex items-center justify-center">
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        {(gradientFrom && gradientTo) && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
        )}
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={gradientFrom ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      {label && (
        <span className="absolute bottom-0 text-xs font-semibold text-heading">{label}</span>
      )}
    </div>
  );
}
