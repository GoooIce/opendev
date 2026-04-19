"use client";

import { useMemo } from "react";
import { crisprEvents } from "@/data/crispr-events";
import type { CRISPREvent } from "@/data/types";

const STATUS_CONFIG: {
  id: CRISPREvent["status"];
  label: string;
  color: string;
}[] = [
  { id: "designed", label: "设计", color: "#8B9BB4" },
  { id: "transforming", label: "转化", color: "#F0A500" },
  { id: "regenerating", label: "再生", color: "#3498DB" },
  { id: "validated", label: "验证", color: "#2ECC71" },
  { id: "phenotyping", label: "表型", color: "#1DB954" },
];

const EDIT_TYPE_COLORS: Record<CRISPREvent["editType"], string> = {
  knockout: "#E74C3C",
  knockin: "#3498DB",
  base_edit: "#9B59B6",
};

export default function ConstructPanel() {
  const lanes = useMemo(() => {
    const grouped: Record<string, CRISPREvent[]> = {};
    for (const cfg of STATUS_CONFIG) {
      grouped[cfg.id] = [];
    }
    for (const event of crisprEvents) {
      grouped[event.status] = [...grouped[event.status], event];
    }
    return STATUS_CONFIG.map((cfg) => ({
      ...cfg,
      events: grouped[cfg.id].slice(0, 4),
      total: grouped[cfg.id].length,
    }));
  }, []);

  return (
    <div className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between">
        <h3
          className="glow-text font-bold"
          style={{ fontSize: "clamp(10px, 0.75vw, 14px)" }}
        >
          CRISPR 构建看板
        </h3>
        <span
          style={{
            fontSize: "clamp(8px, 0.45vw, 10px)",
            color: "var(--text-secondary)",
          }}
        >
          共 {crisprEvents.length} 个编辑事件
        </span>
      </div>

      {/* Swim lanes */}
      <div className="flex-1 flex flex-col gap-[0.3vh] mt-[0.3vh] overflow-hidden">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className="flex-1 flex items-stretch gap-[0.3vw] min-h-0"
          >
            {/* Lane header */}
            <div
              className="flex flex-col items-center justify-center shrink-0"
              style={{
                width: "clamp(28px, 2vw, 40px)",
                borderRadius: "3px",
                background: `${lane.color}10`,
                borderLeft: `2px solid ${lane.color}`,
              }}
            >
              <span style={{ color: lane.color, fontSize: "clamp(8px, 0.5vw, 11px)", fontWeight: 600 }}>
                {lane.label}
              </span>
              <span style={{ color: lane.color, fontSize: "clamp(7px, 0.4vw, 9px)", opacity: 0.7 }}>
                {lane.total}
              </span>
            </div>

            {/* Event cards */}
            <div className="flex-1 flex gap-[0.2vw] overflow-hidden">
              {lane.events.map((event) => (
                <div
                  key={event.id}
                  className="flex-1 flex flex-col justify-center min-w-0"
                  style={{
                    padding: "0.2vh 0.3vw",
                    borderRadius: "3px",
                    background: "rgba(13, 33, 55, 0.6)",
                    border: `1px solid ${EDIT_TYPE_COLORS[event.editType]}30`,
                  }}
                >
                  <div className="flex items-center gap-[0.2vw]">
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: EDIT_TYPE_COLORS[event.editType],
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="truncate"
                      style={{
                        color: "#E8ECF1",
                        fontSize: "clamp(7px, 0.45vw, 10px)",
                        fontWeight: 500,
                      }}
                    >
                      {event.geneName}
                    </span>
                  </div>
                  <span
                    className="truncate"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "clamp(6px, 0.35vw, 8px)",
                      marginTop: "1px",
                    }}
                  >
                    {event.editType === "knockout" ? "KO" : event.editType === "knockin" ? "KI" : "BE"} · {event.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-[0.3vh]" style={{ height: "3px", borderRadius: "2px", background: "rgba(29,185,84,0.1)" }}>
        <div
          style={{
            width: `${((crisprEvents.filter((e) => e.status === "validated" || e.status === "phenotyping").length / crisprEvents.length) * 100).toFixed(0)}%`,
            height: "100%",
            borderRadius: "2px",
            background: "linear-gradient(90deg, #1DB954, #2ECC71)",
          }}
        />
      </div>

      <div className="corner-decoration top-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
