"use client";

import { useState, useEffect } from "react";

interface Metric {
  icon: string;
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
}

const baseMetrics: Metric[] = [
  { icon: "🌡", label: "温度", value: 19, unit: "℃", max: 50, color: "#E74C3C" },
  { icon: "💧", label: "湿度", value: 52, unit: "%", max: 100, color: "#3498DB" },
  { icon: "🌬", label: "风速", value: 2.0, unit: "m/s", max: 15, color: "#1DB954" },
  { icon: "🌧", label: "降水", value: 0, unit: "mm", max: 50, color: "#9B59B6" },
  { icon: "☀", label: "蒸发量", value: 0.326, unit: "mm/h", max: 2, color: "#F0A500" },
];

export default function WeatherPanel({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [metrics, setMetrics] = useState(baseMetrics);

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => {
          const delta = (Math.random() - 0.5) * m.max * 0.02;
          const newValue = Math.max(0, Math.min(m.max, m.value + delta));
          return { ...m, value: Number(newValue.toFixed(m.value < 1 ? 3 : 1)) };
        })
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`data-card p-[0.6vw] flex flex-col gap-[0.4vw] ${className || ""}`} style={style}>
      <h3
        style={{
          fontSize: "clamp(11px, 0.75vw, 16px)",
          color: "var(--color-primary)",
          marginBottom: "0.2vw",
        }}
      >
        气象与种植环境
      </h3>
      {metrics.map((m) => (
        <div key={m.label} className="flex items-center gap-[0.4vw]">
          <span style={{ fontSize: "clamp(12px, 0.9vw, 16px)", width: "1.5vw", textAlign: "center" }}>
            {m.icon}
          </span>
          <span
            style={{
              fontSize: "clamp(9px, 0.55vw, 12px)",
              color: "var(--text-secondary)",
              width: "3vw",
            }}
          >
            {m.label}
          </span>
          <div
            className="flex-1 h-[4px] rounded-full overflow-hidden"
            style={{ background: "rgba(29,185,84,0.1)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(m.value / m.max) * 100}%`,
                background: m.color,
              }}
            />
          </div>
          <span
            style={{
              fontSize: "clamp(10px, 0.65vw, 14px)",
              color: "var(--text-primary)",
              fontWeight: 600,
              width: "4vw",
              textAlign: "right",
            }}
          >
            {m.value} {m.unit}
          </span>
        </div>
      ))}
    </div>
  );
}
