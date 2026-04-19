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
  sparkline?: number[];
  tags?: { label: string; color: string }[];
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
  sparkline,
  tags,
}: KPICardProps) {
  const displayValue = useCountUp({ end: value, duration: 2000, decimals, delay });

  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return num.toLocaleString("zh-CN");
    }
    return decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
  };

  const sparklineMax = sparkline ? Math.max(...sparkline) : 0;
  const sparklineMin = sparkline ? Math.min(...sparkline) : 0;
  const sparkRange = sparklineMax - sparklineMin || 1;

  return (
    <div className="data-card flex-1 p-[0.8vw] flex flex-col justify-between fade-in-up">
      {/* Title row */}
      <div className="flex items-center justify-between">
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
        {tags && (
          <div className="flex gap-[0.3vw]">
            {tags.map((tag) => (
              <span
                key={tag.label}
                style={{
                  fontSize: "clamp(8px, 0.5vw, 11px)",
                  padding: "0 0.3vw",
                  borderRadius: "2px",
                  background: `${tag.color}20`,
                  color: tag.color,
                  border: `1px solid ${tag.color}40`,
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Value + Sparkline */}
      <div className="flex items-end justify-between mt-auto">
        <div>
          <div className="flex items-baseline gap-[0.3vw]">
            <span
              className="font-bold"
              style={{
                fontSize: "clamp(22px, 2.2vw, 44px)",
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

        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <svg
            width="60"
            height="24"
            viewBox={`0 0 ${sparkline.length * 6} 24`}
            style={{ overflow: "visible" }}
          >
            <polyline
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              points={sparkline
                .map((v, i) => {
                  const x = i * 6;
                  const y = 22 - ((v - sparklineMin) / sparkRange) * 20;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
            <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
            <polygon
              fill={`url(#spark-${title})`}
              points={`0,22 ${sparkline
                .map((v, i) => {
                  const x = i * 6;
                  const y = 22 - ((v - sparklineMin) / sparkRange) * 20;
                  return `${x},${y}`;
                })
                .join(" ")} ${(sparkline.length - 1) * 6},22`}
            />
          </svg>
        )}
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
