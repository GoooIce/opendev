"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { ecommerceHistory } from "@/data/economy";

interface ChartProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function ECommerceTrend({ className, style }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    const years = ecommerceHistory.map((d) => String(d.year));
    const values = ecommerceHistory.map((d) => d.revenue);

    chart.setOption({
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(13,33,55,0.95)",
        borderColor: "rgba(29,185,84,0.3)",
        textStyle: { color: "#E8ECF1", fontSize: 12 },
        formatter: (params: unknown) => {
          const p = (params as { name: string; value: number }[])[0];
          return `${p.name}年<br/>交易额：<b>${p.value}</b> 亿元`;
        },
      },
      grid: { left: 45, right: 15, top: 15, bottom: 25 },
      xAxis: {
        type: "category",
        data: years,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "rgba(29,185,84,0.2)" } },
        axisLabel: { color: "#8B9BB4", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(29,185,84,0.1)" } },
        axisLabel: { color: "#8B9BB4", fontSize: 9 },
      },
      series: [
        {
          type: "line",
          data: values,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { color: "#1DB954", width: 2 },
          itemStyle: { color: "#1DB954" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(29,185,84,0.4)" },
              { offset: 1, color: "rgba(29,185,84,0.02)" },
            ]),
          },
          markPoint: {
            data: [{ type: "max", name: "最大值" }],
            symbolSize: 40,
            label: { fontSize: 9, color: "#E8ECF1" },
            itemStyle: { color: "#F0A500" },
          },
        },
      ],
    });

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartRef.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, []);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
