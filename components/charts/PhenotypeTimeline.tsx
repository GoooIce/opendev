"use client";

import { useMemo, useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { phenotypeRecords } from "@/data/phenotypes";

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const TIMEPOINTS = ["V3", "V6", "VT", "R1", "R3"];

const TRAIT_OPTIONS = [
  { key: "plantHeight", label: "株高", unit: "cm" },
  { key: "leafArea", label: "叶面积", unit: "cm²" },
  { key: "chlorophyll", label: "叶绿素", unit: "SPAD" },
  { key: "biomass", label: "生物量", unit: "g" },
  { key: "yield", label: "产量", unit: "t/ha" },
] as const;

type TraitKey = (typeof TRAIT_OPTIONS)[number]["key"];

const NITROGEN_COLORS: Record<string, string> = {
  low: "#E74C3C",
  medium: "#F0A500",
  high: "#1DB954",
};

const NITROGEN_LABELS: Record<string, string> = {
  low: "低氮",
  medium: "中氮",
  high: "高氮",
};

const TOP_LINES = ["B73", "Mo17", "郑单958"];

export default function PhenotypeTimeline() {
  const [selectedTrait, setSelectedTrait] = useState<TraitKey>("plantHeight");

  const option = useMemo(() => {
    const traitDef = TRAIT_OPTIONS.find((t) => t.key === selectedTrait)!;

    const series = TOP_LINES.flatMap((lineName) =>
      (["low", "medium", "high"] as const).map((nLevel) => {
        const data = TIMEPOINTS.map((tp) => {
          const records = phenotypeRecords.filter(
            (r) => r.lineName === lineName && r.nitrogenLevel === nLevel && r.timepoint === tp
          );
          if (records.length === 0) return null;
          const avg = records.reduce((s, r) => s + r.traits[selectedTrait], 0) / records.length;
          return Math.round(avg * 10) / 10;
        });
        return {
          name: `${lineName} · ${NITROGEN_LABELS[nLevel]}`,
          type: "line" as const,
          data,
          smooth: true,
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { width: 1.5, color: NITROGEN_COLORS[nLevel], opacity: 0.85 },
          itemStyle: { color: NITROGEN_COLORS[nLevel] },
          areaStyle: { color: NITROGEN_COLORS[nLevel], opacity: 0.04 },
        };
      })
    );

    return {
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: "rgba(10,22,40,0.95)",
        borderColor: "#1DB954",
        textStyle: { color: "#E8ECF1", fontSize: 10 },
        formatter: (params: { seriesName: string; marker: string; value: number | null; axisValueLabel?: string }[]) => {
          let html = `<b>${params[0]?.axisValueLabel ?? ""}</b><br/>`;
          params.forEach((p) => {
            if (p.value != null) {
              html += `${p.marker} ${p.seriesName}: <b>${p.value}</b> ${traitDef.unit}<br/>`;
            }
          });
          return html;
        },
      },
      legend: {
        show: false,
      },
      grid: { top: 10, right: 10, bottom: 20, left: 38 },
      xAxis: {
        type: "category" as const,
        data: TIMEPOINTS,
        axisLabel: { color: "#8B9BB4", fontSize: 9 },
        axisLine: { lineStyle: { color: "#1E3A5F" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value" as const,
        name: traitDef.unit,
        nameTextStyle: { color: "#8B9BB4", fontSize: 8 },
        axisLabel: { color: "#8B9BB4", fontSize: 9 },
        axisLine: { lineStyle: { color: "#1E3A5F" } },
        splitLine: { lineStyle: { color: "#1E3A5F20" } },
      },
      series,
    };
  }, [selectedTrait]);

  return (
    <div
      className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up"
      style={{ animationDelay: "0.3s" }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="glow-text font-bold"
          style={{ fontSize: "clamp(9px, 0.6vw, 13px)", textAlign: "center" }}
        >
          表型时序变化
        </h3>
        <div className="flex gap-[1px] overflow-hidden">
          {TRAIT_OPTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedTrait(t.key)}
              style={{
                padding: "0.1vh 0.2vw",
                fontSize: "clamp(6px, 0.35vw, 8px)",
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
                color: selectedTrait === t.key ? "#0A1628" : "var(--text-secondary)",
                background: selectedTrait === t.key ? "var(--color-primary)" : "rgba(13,33,55,0.6)",
                transition: "all 0.2s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-[0.2vh]">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ width: "100%", height: "100%" }}
          notMerge
          lazyUpdate
        />
      </div>
      <div className="corner-decoration top-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
