"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { cropData2024 } from "@/data/grain-production";

interface ChartProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function CropYieldChart({ className, style }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);
    chartInstance.current = chart;

    const colors = cropData2024.map((c) => c.color);

    chart.setOption({
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(13,33,55,0.95)",
        borderColor: "rgba(29,185,84,0.3)",
        textStyle: { color: "#E8ECF1", fontSize: 12 },
      },
      legend: {
        data: cropData2024.map((c) => c.name),
        textStyle: { color: "#8B9BB4", fontSize: 10 },
        top: 0,
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: { left: 40, right: 10, top: 30, bottom: 20 },
      xAxis: {
        type: "category",
        data: ["2020", "2021", "2022", "2023", "2024"],
        axisLine: { lineStyle: { color: "rgba(29,185,84,0.2)" } },
        axisLabel: { color: "#8B9BB4", fontSize: 10 },
      },
      yAxis: {
        type: "value",
        name: "万吨",
        nameTextStyle: { color: "#8B9BB4", fontSize: 9 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(29,185,84,0.1)" } },
        axisLabel: { color: "#8B9BB4", fontSize: 9 },
      },
      series: cropData2024.map((crop, i) => ({
        name: crop.name,
        type: "bar",
        stack: "total",
        barWidth: "50%",
        data: [crop.yield * 0.95, crop.yield * 0.97, crop.yield * 0.98, crop.yield * 0.99, crop.yield],
        itemStyle: { color: colors[i], borderRadius: i === cropData2024.length - 1 ? [2, 2, 0, 0] : 0 },
      })),
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(chartRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      chart.dispose();
    };
  }, []);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
