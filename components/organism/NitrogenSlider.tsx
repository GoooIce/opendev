"use client";

import { usePlatformStore } from "@/store/platform-store";
import type { NitrogenLevel, GrowthStage } from "@/data/types";

const NITROGEN_LEVELS: { id: NitrogenLevel; label: string; color: string }[] = [
  { id: "low", label: "低氮", color: "#E74C3C" },
  { id: "medium", label: "中氮", color: "#F0A500" },
  { id: "high", label: "高氮", color: "#2ECC71" },
];

const GROWTH_STAGES: { id: GrowthStage; label: string }[] = [
  { id: "seedling", label: "苗期" },
  { id: "vegetative", label: "营养生长期" },
  { id: "flowering", label: "开花期" },
  { id: "grain_filling", label: "灌浆期" },
];

export default function NitrogenSlider() {
  const { nitrogenLevel, growthStage, setNitrogenLevel, setGrowthStage } =
    usePlatformStore();

  return (
    <div
      className="flex items-center justify-between gap-[1vw] px-[0.6vw] py-[0.3vh]"
      style={{
        background: "rgba(10, 22, 40, 0.85)",
        borderRadius: "4px",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Nitrogen level selector */}
      <div className="flex items-center gap-[0.5vw]">
        <span
          style={{
            fontSize: "clamp(9px, 0.55vw, 12px)",
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          氮水平:
        </span>
        {NITROGEN_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => setNitrogenLevel(level.id)}
            className="cursor-pointer transition-all duration-200"
            style={{
              padding: "0.2vh 0.6vw",
              fontSize: "clamp(9px, 0.55vw, 12px)",
              borderRadius: "3px",
              border: `1px solid ${nitrogenLevel === level.id ? level.color : "transparent"}`,
              background:
                nitrogenLevel === level.id
                  ? `${level.color}20`
                  : "transparent",
              color:
                nitrogenLevel === level.id ? level.color : "var(--text-secondary)",
              fontWeight: nitrogenLevel === level.id ? 600 : 400,
            }}
          >
            {level.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "1.5vh",
          background: "var(--border-color)",
        }}
      />

      {/* Growth stage selector */}
      <div className="flex items-center gap-[0.5vw]">
        <span
          style={{
            fontSize: "clamp(9px, 0.55vw, 12px)",
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          生育期:
        </span>
        {GROWTH_STAGES.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setGrowthStage(stage.id)}
            className="cursor-pointer transition-all duration-200"
            style={{
              padding: "0.2vh 0.5vw",
              fontSize: "clamp(9px, 0.55vw, 12px)",
              borderRadius: "3px",
              border: `1px solid ${growthStage === stage.id ? "var(--color-primary)" : "transparent"}`,
              background:
                growthStage === stage.id
                  ? "rgba(29, 185, 84, 0.1)"
                  : "transparent",
              color:
                growthStage === stage.id
                  ? "var(--color-primary)"
                  : "var(--text-secondary)",
              fontWeight: growthStage === stage.id ? 600 : 400,
            }}
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}
