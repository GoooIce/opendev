"use client";

import { useState, useEffect } from "react";
import type { TabId } from "@/data/types";

interface HeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "全景概览" },
  { id: "omics", label: "多维组学" },
  { id: "mining", label: "基因挖掘" },
  { id: "phenotype", label: "表型鉴定" },
  { id: "validation", label: "功能验证" },
  { id: "ai", label: "AI智囊" },
  { id: "literature", label: "文献中心" },
];

const PROCESS_STEPS = [
  { label: "种质资源", status: "done" as const },
  { label: "组学测序", status: "done" as const },
  { label: "基因挖掘", status: "active" as const },
  { label: "功能验证", status: "pending" as const },
  { label: "育种应用", status: "pending" as const },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="relative w-full flex flex-col" style={{ height: "7vh" }}>
      {/* Top row: tabs + title + time */}
      <div className="flex items-center justify-between px-[2vw] flex-1">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(29,185,84,0.15) 0%, transparent 100%)",
            borderBottom: "1px solid var(--border-color)",
          }}
        />

        {/* Left: tabs */}
        <nav className="flex gap-[0.4vw] z-10">
          {TABS.slice(0, 4).map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </nav>

        {/* Center title */}
        <div className="flex flex-col items-center z-10">
          <h1
            className="glow-text font-bold tracking-[0.3vw]"
            style={{
              fontSize: "clamp(18px, 1.6vw, 36px)",
              color: "var(--color-accent)",
            }}
          >
            玉米氮高效高通量基因挖掘与应用平台
          </h1>
        </div>

        {/* Right: tabs + time */}
        <div className="flex items-center gap-[1vw] z-10">
          <nav className="flex gap-[0.4vw]">
            {TABS.slice(4).map((tab) => (
              <TabButton
                key={tab.id}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
              />
            ))}
          </nav>
          <span
            style={{
              fontSize: "clamp(10px, 0.6vw, 14px)",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {time}
          </span>
        </div>
      </div>

      {/* Process status bar */}
      <div
        className="flex items-center justify-center gap-[0.5vw] px-[10vw] z-10"
        style={{ height: "1.5vh" }}
      >
        {PROCESS_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-[0.3vw]">
            <div
              className="flex items-center gap-[0.3vw]"
              style={{
                fontSize: "clamp(9px, 0.55vw, 12px)",
                color:
                  step.status === "done"
                    ? "var(--color-success)"
                    : step.status === "active"
                      ? "var(--color-accent)"
                      : "var(--text-secondary)",
              }}
            >
              {step.status === "done" && "●"}
              {step.status === "active" && "▶"}
              {step.status === "pending" && "○"}
              <span>{step.label}</span>
            </div>
            {i < PROCESS_STEPS.length - 1 && (
              <div
                style={{
                  width: "2vw",
                  height: "1px",
                  background:
                    step.status === "done"
                      ? "var(--color-success)"
                      : "var(--border-color)",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </header>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative px-[0.7vw] py-[0.2vw] text-center cursor-pointer transition-all duration-200"
      style={{
        fontSize: "clamp(10px, 0.75vw, 15px)",
        color: active ? "var(--color-primary)" : "var(--text-secondary)",
        background: active ? "rgba(29, 185, 84, 0.1)" : "transparent",
        clipPath: "polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)",
        border: active
          ? "1px solid var(--border-glow)"
          : "1px solid transparent",
        letterSpacing: "0.05vw",
      }}
    >
      {label}
    </button>
  );
}
