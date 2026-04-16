"use client";

import { useCountUp } from "@/hooks/useCountUp";

export default function IrrigationPanel({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const area = useCountUp({ end: 6.38, decimals: 2, delay: 300 });
  const coeff = useCountUp({ end: 0.58, decimals: 2, delay: 500 });

  return (
    <div className={`data-card p-[0.6vw] flex flex-col h-full ${className || ""}`} style={style}>
      <h3 style={{ fontSize: "clamp(11px, 0.8vw, 16px)", color: "var(--color-primary)" }}>
        灌溉数据
      </h3>

      {/* Core metrics */}
      <div className="flex gap-[0.3vw] mt-[0.3vw]">
        <div
          className="flex-1 p-[0.4vw] rounded text-center"
          style={{ background: "rgba(29,185,84,0.08)" }}
        >
          <div style={{ fontSize: "clamp(9px, 0.5vw, 11px)", color: "var(--text-secondary)" }}>
            节水灌溉面积
          </div>
          <div style={{ fontSize: "clamp(16px, 1.4vw, 28px)", color: "var(--text-primary)", fontWeight: 700 }}>
            {area}
          </div>
          <div style={{ fontSize: "clamp(8px, 0.45vw, 10px)", color: "var(--text-secondary)" }}>亿亩</div>
        </div>
        <div
          className="flex-1 p-[0.4vw] rounded text-center"
          style={{ background: "rgba(29,185,84,0.08)" }}
        >
          <div style={{ fontSize: "clamp(9px, 0.5vw, 11px)", color: "var(--text-secondary)" }}>
            灌溉水利用系数
          </div>
          <div style={{ fontSize: "clamp(16px, 1.4vw, 28px)", color: "var(--text-primary)", fontWeight: 700 }}>
            {coeff}
          </div>
          <div style={{ fontSize: "clamp(8px, 0.45vw, 10px)", color: "var(--text-secondary)" }}></div>
        </div>
      </div>

      {/* Detail rows */}
      <div className="mt-[0.3vw] space-y-[0.2vw] flex-1">
        <DataRow label="累计灌溉水量" value="23,678" unit="m³" />
        <DataRow label="灌溉压力" value="0.29" unit="MPa" />
        <DataRow label="当前灌溉流量" value="0.78" unit="m³/h" />
        <DataRow label="当前阀门数量" value="49" unit="个" />
        <DataRow label="水池液位" value="2.30" unit="m" />
      </div>
    </div>
  );
}

function DataRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div
      className="flex justify-between items-center px-[0.4vw] py-[0.15vw] rounded"
      style={{ background: "rgba(29,185,84,0.06)" }}
    >
      <span style={{ fontSize: "clamp(8px, 0.5vw, 11px)", color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span style={{ fontSize: "clamp(10px, 0.65vw, 14px)", color: "var(--text-primary)", fontWeight: 600 }}>
        {value}
        <small style={{ fontSize: "0.8em", color: "var(--text-secondary)", marginLeft: 2 }}>{unit}</small>
      </span>
    </div>
  );
}
