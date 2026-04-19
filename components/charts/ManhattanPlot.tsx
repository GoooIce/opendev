"use client";

import { useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { ScatterChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { gwasResults } from "@/data/gwas-results";
import { usePlatformStore } from "@/store/platform-store";

echarts.use([
  ScatterChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

const CHR_COLORS = [
  "#1DB954", "#3498DB", "#F0A500", "#E74C3C", "#9B59B6",
  "#1ABC9C", "#E67E22", "#2ECC71", "#34495E", "#8B9BB4",
];

const THRESHOLD = -Math.log10(5e-8);

function computeChromosomeOffsets(results: typeof gwasResults) {
  const chrMax = new Map<number, number>();
  results.forEach((r) => {
    const cur = chrMax.get(r.chromosome) ?? 0;
    if (r.position > cur) chrMax.set(r.chromosome, r.position);
  });

  const offsets = new Map<number, number>();
  let cumulative = 0;
  for (let chr = 1; chr <= 10; chr++) {
    offsets.set(chr, cumulative);
    cumulative += (chrMax.get(chr) ?? 0) + 5_000_000;
  }
  return { offsets, total: cumulative };
}

export default function ManhattanPlot() {
  const { setSelectedGene } = usePlatformStore();

  const { seriesData, xLabels, totalLength } = useMemo(() => {
    const { offsets, total } = computeChromosomeOffsets(gwasResults);

    const significant: [number, number, number][] = [];
    const background: [number, number, number][] = [];

    gwasResults.forEach((r, idx) => {
      const x = offsets.get(r.chromosome)! + r.position;
      const y = -Math.log10(r.pValue);
      const point: [number, number, number] = [x, y, idx];
      if (r.isSignificant) {
        significant.push(point);
      } else {
        background.push(point);
      }
    });

    const labels: { value: number; label: string }[] = [];
    for (let chr = 1; chr <= 10; chr++) {
      const chrResults = gwasResults.filter((r) => r.chromosome === chr);
      const midPos = chrResults.length > 0
        ? chrResults[Math.floor(chrResults.length / 2)].position
        : 0;
      labels.push({ value: offsets.get(chr)! + midPos, label: `Chr${chr}` });
    }

    return { seriesData: { significant, background }, xLabels: labels, totalLength: total };
  }, []);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item" as const,
        backgroundColor: "rgba(10,22,40,0.95)",
        borderColor: "#1DB954",
        textStyle: { color: "#E8ECF1", fontSize: 10 },
        formatter: (params: { data: number[] }) => {
          const idx = params.data[2];
          const r = gwasResults[idx];
          if (!r) return "";
          return `<b>${r.snp}</b><br/>
            Chr${r.chromosome}:${(r.position / 1e6).toFixed(2)}Mb<br/>
            p: ${r.pValue.toExponential(2)}<br/>
            -log10(p): <b>${(-Math.log10(r.pValue)).toFixed(2)}</b><br/>
            Gene: <i>${r.nearestGene}</i><br/>
            Trait: ${r.trait}`;
        },
      },
      grid: { top: 10, right: 10, bottom: 24, left: 40 },
      xAxis: {
        type: "value" as const,
        min: 0,
        max: totalLength,
        axisLabel: {
          color: "#8B9BB4",
          fontSize: 9,
          formatter: (val: number) => {
            const match = xLabels.find(
              (l) => Math.abs(l.value - val) < totalLength * 0.04
            );
            return match ? match.label : "";
          },
          interval: 0,
        },
        axisLine: { lineStyle: { color: "#1E3A5F" } },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value" as const,
        name: "-log₁₀(p)",
        nameTextStyle: { color: "#8B9BB4", fontSize: 9 },
        axisLabel: { color: "#8B9BB4", fontSize: 9 },
        axisLine: { lineStyle: { color: "#1E3A5F" } },
        splitLine: { lineStyle: { color: "#1E3A5F20" } },
      },
      dataZoom: [
        {
          type: "inside" as const,
          xAxisIndex: 0,
          filterMode: "none" as const,
        },
      ],
      series: [
        {
          name: "Background",
          type: "scatter",
          data: seriesData.background,
          symbolSize: 2,
          itemStyle: { color: "#2a4a6a", opacity: 0.5 },
          emphasis: { itemStyle: { color: "#1DB954", opacity: 1 } },
          animation: false,
        },
        {
          name: "Significant",
          type: "scatter",
          data: seriesData.significant,
          symbolSize: 5,
          itemStyle: { color: "#F0A500", opacity: 0.9 },
          emphasis: { itemStyle: { color: "#FFD700", borderWidth: 1, borderColor: "#fff" } },
          animation: false,
          markLine: {
            silent: true,
            symbol: "none" as const,
            lineStyle: { color: "#E74C3C", type: "dashed" as const, width: 1 },
            data: [{ yAxis: THRESHOLD }],
            label: {
              show: true,
              position: "insideEndTop" as const,
              formatter: "p=5e-8",
              color: "#E74C3C",
              fontSize: 8,
            },
          },
        },
      ],
    }),
    [seriesData, xLabels, totalLength]
  );

  const handleClick = (params: { data?: number[] }) => {
    if (!params.data) return;
    const idx = params.data[2];
    const r = gwasResults[idx];
    if (!r) return;
  };

  return (
    <div className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up">
      <h3
        className="glow-text font-bold"
        style={{ fontSize: "clamp(9px, 0.6vw, 13px)", textAlign: "center" }}
      >
        GWAS 曼哈顿图
      </h3>
      <div className="flex-1 min-h-0 mt-[0.2vh]">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ width: "100%", height: "100%" }}
          notMerge
          lazyUpdate
          onEvents={{ click: handleClick }}
        />
      </div>
      <div className="corner-decoration top-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
