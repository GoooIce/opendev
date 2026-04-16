"use client";

import { useCountUp } from "@/hooks/useCountUp";

interface KPICardProps {
  icon: string;
  title: string;
  value: number;
  unit: string;
  suffix?: string;
  trend?: { value: number; label: string };
  decimals?: number;
  delay?: number;
}

export default function KPICard({
  icon,
  title,
  value,
  unit,
  suffix,
  trend,
  decimals = 0,
  delay = 0,
}: KPICardProps) {
  const displayValue = useCountUp({ end: value, duration: 2000, decimals, delay });

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return num.toLocaleString("zh-CN");
    }
    return decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
  };

  return (
    <div className="data-card flex-1 p-[0.8vw] flex flex-col justify-between fade-in-up">
      {/* Title */}
      <div className="flex items-center gap-[0.4vw]">
        <span style={{ fontSize: "clamp(14px, 1.2vw, 22px)" }}>{icon}</span>
        <span
          style={{
            fontSize: "clamp(11px, 0.75vw, 16px)",
            color: "var(--text-secondary)",
          }}
        >
          {title}
        </span>
      </div>

      {/* Value */}
      <div className="mt-auto">
        <div className="flex items-baseline gap-[0.3vw]">
          <span
            className="font-bold"
            style={{
              fontSize: "clamp(22px, 2.4vw, 48px)",
              color: "var(--text-primary)",
            }}
          >
            {formatNumber(displayValue)}
          </span>
          {suffix && (
            <span
              style={{
                fontSize: "clamp(12px, 0.7vw, 16px)",
                color: "var(--text-secondary)",
              }}
            >
              {suffix}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "clamp(10px, 0.6vw, 14px)",
            color: "var(--text-secondary)",
          }}
        >
          {unit}
        </span>
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-[0.3vw] mt-[0.3vw]">
          <span
            style={{
              fontSize: "clamp(10px, 0.65vw, 14px)",
              color: trend.value > 0 ? "var(--color-success)" : "var(--color-danger)",
              fontWeight: 500,
            }}
          >
            {trend.value > 0 ? "▲" : "▼"} {Math.abs(trend.value)}%
          </span>
          <span
            style={{
              fontSize: "clamp(9px, 0.55vw, 12px)",
              color: "var(--text-secondary)",
            }}
          >
            {trend.label}
          </span>
        </div>
      )}

      {/* Corner decorations */}
      <div className="corner-decoration top-left" />
      <div className="corner-decoration top-right" />
      <div className="corner-decoration bottom-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
