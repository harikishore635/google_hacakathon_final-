"use client";

import { useEffect, useRef, useState } from "react";

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  value: number | string;
  suffix?: string;
  label: string;
  trend?: { direction: "up" | "down"; value: string };
  gaugeValue?: number;
  gaugeColor?: string;
  gaugeGradientFrom?: string;
  gaugeGradientTo?: string;
  delay?: number;
}

export default function StatCard({
  icon,
  iconColor,
  iconBg,
  value,
  suffix = "",
  label,
  trend,
  gaugeValue,
  gaugeColor,
  gaugeGradientFrom,
  gaugeGradientTo,
  delay = 0,
}: StatCardProps) {
  const [inView, setInView] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

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

  // Count-up animation
  useEffect(() => {
    if (!inView || typeof value !== "number") return;
    const target = value;
    const duration = 1200;
    const startTime = performance.now();

    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplayValue(parseFloat((target * eased).toFixed(1)));
      if (progress < 1) requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => requestAnimationFrame(tick), delay);
    return () => clearTimeout(timer);
  }, [inView, value, delay]);

  // Arc gauge calculations
  const gaugeSize = 70;
  const gaugeStroke = 6;
  const gaugeRadius = (gaugeSize - gaugeStroke) / 2;
  const gaugeCircumference = Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - ((gaugeValue ?? 0) / 100) * gaugeCircumference;
  const gradId = `sg-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div
      ref={ref}
      className={`stat-card transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}ms` }}>

      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm"
          style={{ background: iconBg, color: iconColor }}>
          <i className={`fas ${icon}`} />
        </div>

        {/* Trend Badge */}
        {trend && (
          <span className={`pill text-xs font-semibold ${
            trend.direction === "up"
              ? "bg-success-dim text-success"
              : "bg-danger-dim text-danger"
          }`}>
            <i className={`fas fa-arrow-${trend.direction} text-[10px]`} />
            {trend.value}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          {/* Value */}
          <div className="text-3xl font-bold text-heading leading-none mb-1">
            {typeof value === "number" ? displayValue : value}
            {suffix && <span className="text-lg text-label">{suffix}</span>}
          </div>
          {/* Label */}
          <p className="text-sm text-label font-medium">{label}</p>
        </div>

        {/* Arc Gauge */}
        {gaugeValue !== undefined && (
          <div className="relative">
            <svg width={gaugeSize} height={gaugeSize / 2 + gaugeStroke} viewBox={`0 0 ${gaugeSize} ${gaugeSize / 2 + gaugeStroke}`}>
              {(gaugeGradientFrom && gaugeGradientTo) && (
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={gaugeGradientFrom} />
                    <stop offset="100%" stopColor={gaugeGradientTo} />
                  </linearGradient>
                </defs>
              )}
              <path
                d={`M ${gaugeStroke / 2} ${gaugeSize / 2} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${gaugeSize - gaugeStroke / 2} ${gaugeSize / 2}`}
                fill="none" stroke="var(--dash-gauge-track, #E5E7EB)" strokeWidth={gaugeStroke} strokeLinecap="round"
              />
              <path
                d={`M ${gaugeStroke / 2} ${gaugeSize / 2} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${gaugeSize - gaugeStroke / 2} ${gaugeSize / 2}`}
                fill="none"
                stroke={gaugeGradientFrom ? `url(#${gradId})` : (gaugeColor || "#FF6B35")}
                strokeWidth={gaugeStroke} strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={inView ? gaugeOffset : gaugeCircumference}
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
