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

function randomId(): string {
  return `T${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function randomElapsed(): string {
  const s = Math.floor(Math.random() * 300) + 5;
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}

function randomTimestamp(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.floor(Math.random() * 60));
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function createEntry(statusOverride?: TaskStatus): LogEntry {
  const taskDef = TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)];
  const statuses: TaskStatus[] = ["queued", "running", "completed", "completed", "completed", "failed"];
  const status = statusOverride ?? statuses[Math.floor(Math.random() * statuses.length)];
  return {
    id: randomId(),
    type: taskDef.type,
    status,
    progress: status === "completed" ? 100 : status === "failed" ? Math.floor(Math.random() * 80) : Math.floor(Math.random() * 100),
    elapsed: randomElapsed(),
    timestamp: randomTimestamp(),
  };
}

const TYPE_MAP = Object.fromEntries(TASK_TYPES.map((t) => [t.type, t]));

export default function AnalysisLog() {
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    Array.from({ length: 10 }, () => createEntry())
  );
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setLogs((prev) => {
        const updated = prev.map((entry) =>
          entry.status === "running"
            ? { ...entry, progress: Math.min(100, entry.progress + Math.floor(Math.random() * 15)) }
            : entry
        );
        return [createEntry("running"), ...updated].slice(0, 20);
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
