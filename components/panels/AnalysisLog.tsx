"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type TaskStatus = "queued" | "running" | "completed" | "failed";
type TaskType = "sequencing" | "gwas" | "rnaseq" | "network" | "model";

interface LogEntry {
  id: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  elapsed: string;
  timestamp: string;
}

const TASK_TYPES: { type: TaskType; label: string; color: string }[] = [
  { type: "sequencing", label: "测序处理", color: "var(--color-genomics)" },
  { type: "gwas", label: "GWAS分析", color: "var(--color-phenome)" },
  { type: "rnaseq", label: "RNA-seq", color: "var(--color-transcript)" },
  { type: "network", label: "网络构建", color: "var(--color-protein)" },
  { type: "model", label: "模型训练", color: "var(--color-metabolite)" },
];

const STATUS_STYLES: Record<TaskStatus, { color: string; icon: string }> = {
  queued: { color: "#8B9BB4", icon: "◎" },
  running: { color: "#F0A500", icon: "◉" },
  completed: { color: "#1DB954", icon: "●" },
  failed: { color: "#E74C3C", icon: "✕" },
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function createSeededEntry(index: number, statusOverride?: TaskStatus): LogEntry {
  const s = (i: number) => seededRandom(index * 100 + i);
  const typeIdx = Math.floor(s(1) * TASK_TYPES.length);
  const taskDef = TASK_TYPES[typeIdx];
  const statuses: TaskStatus[] = ["queued", "running", "completed", "completed", "completed", "failed"];
  const status = statusOverride ?? statuses[Math.floor(s(2) * statuses.length)];
  const progress = status === "completed" ? 100 : status === "failed" ? Math.floor(s(3) * 80) : Math.floor(s(4) * 100);
  const totalSec = Math.floor(s(5) * 300) + 5;
  const elapsed = totalSec >= 60 ? `${Math.floor(totalSec / 60)}m${totalSec % 60}s` : `${totalSec}s`;
  const h = Math.floor(s(6) * 2) + 14;
  const m = Math.floor(s(7) * 60);
  const sec = Math.floor(s(8) * 60);
  const timestamp = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  return {
    id: `T${String(Math.floor(s(9) * 9000) + 1000)}`,
    type: taskDef.type,
    status,
    progress,
    elapsed,
    timestamp,
  };
}

const INITIAL_LOGS: LogEntry[] = Array.from({ length: 10 }, (_, i) => createSeededEntry(i));

const TYPE_MAP = Object.fromEntries(TASK_TYPES.map((t) => [t.type, t]));

export default function AnalysisLog() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(INITIAL_LOGS.length);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      counterRef.current += 1;
      const newEntry = createSeededEntry(counterRef.current + 1000, "running");
      setLogs((prev) => {
        const updated = prev.map((entry) =>
          entry.status === "running"
            ? { ...entry, progress: Math.min(100, entry.progress + Math.floor(seededRandom(entry.progress * 7 + 13) * 15)) }
            : entry
        );
        return [newEntry, ...updated].slice(0, 20);
      });
    }, 8000);
    return () => clearInterval(id);
  }, [paused]);

  const handleRetry = useCallback((entryId: string) => {
    setLogs((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, status: "running" as TaskStatus, progress: 0 } : e
      )
    );
  }, []);

  return (
    <div
      className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up"
      style={{ animationDelay: "0.4s" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="glow-text font-bold" style={{ fontSize: "clamp(10px, 0.75vw, 14px)" }}>
          分析日志
        </h3>
        <div className="flex items-center gap-[0.3vw]">
          {paused && (
            <span style={{ fontSize: "clamp(6px, 0.35vw, 8px)", color: "var(--text-muted)" }}>
              已暂停
            </span>
          )}
          <span style={{ fontSize: "clamp(7px, 0.4vw, 9px)", color: "var(--text-secondary)" }}>
            {logs.filter((l) => l.status === "running").length} 运行中
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto mt-[0.3vh] min-h-0"
        style={{ scrollbarWidth: "thin" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {logs.map((log, i) => {
          const taskDef = TYPE_MAP[log.type];
          const statusStyle = STATUS_STYLES[log.status];
          return (
            <div
              key={`${log.id}-${i}`}
              className="flex items-center gap-[0.2vw]"
              style={{
                padding: "0.2vh 0",
                borderBottom: "1px solid rgba(29,185,84,0.05)",
                opacity: i === 0 ? 1 : 0.75,
                transition: "opacity 0.3s ease",
              }}
            >
              <span style={{ color: statusStyle.color, fontSize: "clamp(7px, 0.4vw, 9px)", flexShrink: 0 }}>
                {statusStyle.icon}
              </span>
              <span
                className="truncate"
                style={{
                  fontSize: "clamp(6px, 0.35vw, 8px)",
                  color: "var(--text-muted)",
                  width: "clamp(30px, 2.4vw, 42px)",
                  flexShrink: 0,
                }}
              >
                {log.id}
              </span>
              <span
                style={{
                  fontSize: "clamp(6px, 0.35vw, 8px)",
                  color: taskDef.color,
                  flexShrink: 0,
                }}
              >
                {taskDef.label}
              </span>
              <div className="flex-1 mx-[0.2vw]" style={{ height: "2px", background: "rgba(29,185,84,0.1)", borderRadius: "1px" }}>
                <div
                  style={{
                    width: `${log.progress}%`,
                    height: "100%",
                    borderRadius: "1px",
                    background: statusStyle.color,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "clamp(6px, 0.33vw, 7px)",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  width: "clamp(22px, 1.6vw, 28px)",
                  textAlign: "right",
                }}
              >
                {log.elapsed}
              </span>
              <span
                style={{
                  fontSize: "clamp(6px, 0.33vw, 7px)",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  width: "clamp(26px, 1.8vw, 32px)",
                  textAlign: "right",
                }}
              >
                {log.timestamp}
              </span>
              {log.status === "failed" && (
                <button
                  onClick={() => handleRetry(log.id)}
                  style={{
                    fontSize: "clamp(6px, 0.33vw, 7px)",
                    color: "var(--color-danger)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    padding: "0 0.1vw",
                  }}
                >
                  重试
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="corner-decoration top-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
