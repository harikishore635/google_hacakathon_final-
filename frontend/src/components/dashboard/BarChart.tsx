"use client";

import { useEffect, useRef, useState } from "react";

interface BarChartProps {
  data: { label: string; value: number }[];
  highlightIndex?: number;
  maxValue?: number;
}

export default function BarChart({ data, highlightIndex, maxValue }: BarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const height = (d.value / max) * 100;
          const isHighlighted = i === highlightIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className={`text-[10px] font-semibold mb-1 transition-all duration-500 ${
                inView ? "opacity-100" : "opacity-0"
              }`}
                style={{ color: isHighlighted ? "#FF6B35" : "#9CA3AF", transitionDelay: `${i * 80 + 400}ms` }}>
                {d.value}
              </span>
              <div
                className={`w-full rounded-t-lg transition-all ${isHighlighted ? "animate-pulse-glow" : ""}`}
                style={{
                  height: inView ? `${height}%` : "0%",
                  background: isHighlighted
                    ? "linear-gradient(180deg, #FF6B35 0%, #FF8F63 100%)"
                    : "#E5E7EB",
                  transition: `height 0.6s ease-out ${i * 80}ms`,
                  minHeight: inView ? "4px" : "0px",
                }}
              />
              <span className="text-[9px] text-label font-medium mt-1">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
