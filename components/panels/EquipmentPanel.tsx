"use client";

import { useState } from "react";
import { equipmentData } from "@/data/smart-agriculture";

const icons = ["🚁", "🛰️", "📡", "💧"];

export default function EquipmentPanel({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [active, setActive] = useState(0);
  const item = equipmentData[active];

  return (
    <div className={`data-card p-[0.6vw] flex flex-col h-full ${className || ""}`} style={style}>
      <h3 style={{ fontSize: "clamp(11px, 0.8vw, 16px)", color: "var(--color-primary)" }}>
        智慧农业设备
      </h3>

      {/* Tabs */}
      <div className="flex gap-[0.2vw] mt-[0.3vw]">
        {equipmentData.map((eq, i) => (
          <button
            key={eq.name}
            onClick={() => setActive(i)}
            className="px-[0.3vw] py-[0.2vw] rounded-sm transition-all"
            style={{
              fontSize: "clamp(8px, 0.5vw, 11px)",
              color: active === i ? "var(--color-primary)" : "var(--text-secondary)",
              background: active === i ? "rgba(29,185,84,0.15)" : "transparent",
              border: `1px solid ${active === i ? "var(--border-glow)" : "transparent"}`,
              cursor: "pointer",
            }}
          >
            {eq.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-[0.5vw] mt-[0.3vw]">
        <span style={{ fontSize: "clamp(28px, 3vw, 48px)" }}>{icons[active]}</span>

        <div className="w-full space-y-[0.3vw]">
          <DataField label="保有量" value={item.count} />
          <DataField label="在线率" value={item.onlineRate} />
          <DataField label="覆盖范围" value={item.workArea} />
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between items-center px-[0.4vw] py-[0.2vw] rounded"
      style={{ background: "rgba(29,185,84,0.06)" }}
    >
      <span style={{ fontSize: "clamp(9px, 0.5vw, 11px)", color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span style={{ fontSize: "clamp(10px, 0.65vw, 14px)", color: "var(--text-primary)", fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}
