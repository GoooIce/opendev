"use client";

import { useState, useEffect, useRef } from "react";

interface LogEntry {
  id: string;
  type: string;
  value: string;
  time: string;
  color: string;
}

const logTypes = [
  { type: "传感器数据", color: "#1DB954" },
  { type: "无人机数据", color: "#3498DB" },
  { type: "控制器数据", color: "#F0A500" },
  { type: "灌溉阀数据", color: "#00BCD4" },
  { type: "气象站数据", color: "#9B59B6" },
];

function randomId() {
  return Math.random().toString(36).substring(2, 5).toUpperCase();
}
function randomValue() {
  return (Math.random() * 200 + 50).toFixed(2);
}
function randomTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.floor(Math.random() * 60));
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function createEntry(): LogEntry {
  const t = logTypes[Math.floor(Math.random() * logTypes.length)];
  return { id: randomId(), type: t.type, value: randomValue(), time: randomTime(), color: t.color };
}

const initialLogs: LogEntry[] = Array.from({ length: 10 }, createEntry);

export default function DataLog({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [logs, setLogs] = useState(initialLogs);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setLogs((prev) => [createEntry(), ...prev].slice(0, 20));
    }, 5000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div className={`data-card p-[0.6vw] flex flex-col h-full ${className || ""}`} style={style}>
      <h3 style={{ fontSize: "clamp(11px, 0.8vw, 16px)", color: "var(--color-primary)" }}>
        数据日志
      </h3>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden mt-[0.2vw]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <table className="w-full" style={{ fontSize: "clamp(8px, 0.48vw, 10px)" }}>
          <thead>
            <tr style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-color)" }}>
              <th className="text-left py-[0.1vw]">编号</th>
              <th className="text-left">类型</th>
              <th className="text-right">数据值</th>
              <th className="text-right">时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr
                key={`${log.id}-${i}`}
                className="transition-opacity duration-300"
                style={{
                  opacity: i === 0 ? 1 : 0.7,
                  color: "var(--text-primary)",
                  borderBottom: "1px solid rgba(29,185,84,0.05)",
                }}
              >
                <td className="py-[0.15vw]" style={{ color: "var(--text-secondary)" }}>{log.id}</td>
                <td style={{ color: log.color }}>{log.type}</td>
                <td className="text-right">{log.value}</td>
                <td className="text-right" style={{ color: "var(--text-secondary)" }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paused && (
        <div className="text-center" style={{ fontSize: "clamp(8px, 0.4vw, 9px)", color: "var(--text-secondary)" }}>
          滚动已暂停
        </div>
      )}
    </div>
  );
}
