"use client";

import { useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import { GridComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { expressionMatrix } from "@/data/expression-matrix";

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

const OMICS_STATS = [
  { label: "基因组", value: "1,247", unit: "候选基因", color: "var(--color-genomics)" },
  { label: "转录组", value: "100×60", unit: "表达矩阵", color: "var(--color-transcript)" },
  { label: "蛋白组", value: "384", unit: "定量蛋白", color: "var(--color-protein)" },
  { label: "代谢组", value: "156", unit: "代谢物", color: "var(--color-metabolite)" },
];

const TOP_GENES = [
  "ZmNRT1.1", "ZmNRT2.1", "ZmAMT1.1", "ZmGS1.3", "ZmGOGAT1",
  "ZmNIA1", "ZmDof1", "ZmMYB72", "ZmNLP5", "ZmNRT3.1",
];

const TISSUES = ["root", "leaf", "stem", "kernel", "tassel"];
const TISSUE_LABELS: Record<string, string> = {
  root: "根", leaf: "叶", stem: "茎", kernel: "籽粒", tassel: "雄穗",
};

export default function OmicsDataPanel() {
  const heatmapData = useMemo(() => {
    const data: [number, number, number][] = [];
    TOP_GENES.forEach((gene, yIdx) => {
      TISSUES.forEach((tissue, xIdx) => {
        const record = expressionMatrix.find(
          (r) => r.geneName === gene && r.tissue === tissue && r.condition === "lowN" && r.timepoint === "6h"
        );
        data.push([xIdx, yIdx, record?.log2FC ?? 0]);
      });
    });
    return data;
  }, []);

  const option = useMemo(
    () => ({
      tooltip: {
        formatter: (params: { data: number[] }) => {
          const [x, y, val] = params.data;
          return `${TOP_GENES[y]} / ${TISSUE_LABELS[TISSUES[x]]}<br/>log2FC: <b>${val.toFixed(2)}</b>`;
        },
        backgroundColor: "rgba(10,22,40,0.95)",
        borderColor: "var(--color-primary)",
        textStyle: { color: "#E8ECF1", fontSize: 11 },
      },
      grid: {
        top: 8,
        right: 40,
        bottom: 8,
        left: 58,
        containLabel: false,
      },
      xAxis: {
        type: "category" as const,
        data: TISSUES.map((t) => TISSUE_LABELS[t]),
        axisLabel: { color: "#8B9BB4", fontSize: 9 },
        axisLine: { lineStyle: { color: "#1E3A5F" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "category" as const,
        data: TOP_GENES,
        axisLabel: { color: "#8B9BB4", fontSize: 8 },
        axisLine: { lineStyle: { color: "#1E3A5F" } },
        axisTick: { show: false },
      },
      visualMap: {
        min: -4,
        max: 4,
        calculable: false,
        orient: "vertical" as const,
        right: 0,
        top: "center",
        itemHeight: 80,
        itemWidth: 8,
        textStyle: { color: "#8B9BB4", fontSize: 8 },
        inRange: {
          color: ["#1a3a6a", "#1E3A5F", "#2a5a3a", "#1DB954", "#a5f3c0"],
        },
      },
      series: [
        {
          type: "heatmap",
          data: heatmapData,
          itemStyle: { borderRadius: 2, borderWidth: 1, borderColor: "#0A1628" },
          emphasis: { itemStyle: { borderColor: "#1DB954", borderWidth: 2 } },
        },
      ],
    }),
    [heatmapData]
  );

  return (
    <div className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up">
      <h3
        className="glow-text font-bold"
        style={{ fontSize: "clamp(10px, 0.75vw, 14px)" }}
      >
        多维组学数据总览
      </h3>

      {/* Omics stat cards */}
      <div className="grid grid-cols-4 gap-[0.3vw] mt-[0.3vh]">
        {OMICS_STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center"
            style={{
              padding: "0.3vh 0",
              borderRadius: "3px",
              background: `${stat.color}08`,
              border: `1px solid ${stat.color}20`,
            }}
          >
            <span style={{ color: stat.color, fontSize: "clamp(9px, 0.6vw, 13px)", fontWeight: 700 }}>
              {stat.value}
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: "clamp(7px, 0.45vw, 10px)" }}>
              {stat.label} · {stat.unit}
            </span>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="flex-1 min-h-0 mt-[0.3vh]">
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
