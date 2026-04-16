"use client";

import { useState, useEffect } from "react";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS_LEFT = ["主页", "耕地保护", "智慧农业", "生产监测"];
const TABS_RIGHT = ["产业经济", "质量安全", "AI 分析"];

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
    <header className="relative w-full h-[8vh] flex items-center justify-between px-[2vw]">
      {/* Background image line */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(29,185,84,0.15) 0%, transparent 100%)",
          borderBottom: "1px solid var(--border-color)",
        }}
      />

      {/* Left tabs */}
      <nav className="flex gap-[0.6vw] z-10 w-[30%]">
        {TABS_LEFT.map((tab) => (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => onTabChange(tab)}
          />
        ))}
      </nav>

      {/* Center title */}
      <div className="flex flex-col items-center z-10">
        <h1
          className="glow-text font-bold tracking-[0.4vw]"
          style={{
            fontSize: "clamp(20px, 1.8vw, 42px)",
            color: "var(--color-accent)",
          }}
        >
          农业产业大数据指挥仓
        </h1>
        <span
          className="mt-0.5"
          style={{ fontSize: "clamp(10px, 0.6vw, 14px)", color: "var(--text-secondary)" }}
        >
          {time}
        </span>
      </div>

      {/* Right tabs */}
      <nav className="flex gap-[0.6vw] z-10 w-[30%] justify-end">
        {TABS_RIGHT.map((tab) => (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => onTabChange(tab)}
          />
        ))}
      </nav>
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
      className="relative px-[0.8vw] py-[0.3vw] text-center cursor-pointer transition-all duration-200"
      style={{
        fontSize: "clamp(11px, 0.85vw, 16px)",
        color: active ? "var(--color-primary)" : "var(--text-secondary)",
        background: active ? "rgba(29, 185, 84, 0.1)" : "transparent",
        clipPath: "polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)",
        border: active ? "1px solid var(--border-glow)" : "1px solid transparent",
        letterSpacing: "0.1vw",
      }}
    >
      {label}
    </button>
  );
}
