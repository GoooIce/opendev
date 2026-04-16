"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface ChartProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function EconomyRing({ className, style }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    chart.setOption({
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(13,33,55,0.95)",
        borderColor: "rgba(29,185,84,0.3)",
        textStyle: { color: "#E8ECF1", fontSize: 11 },
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        textStyle: { color: "#8B9BB4", fontSize: 9 },
        itemWidth: 10,
        itemHeight: 8,
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          center: ["50%", "42%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "outside",
            fontSize: 9,
            color: "#8B9BB4",
            formatter: "{b}: {d}%",
          },
          labelLine: { lineStyle: { color: "rgba(29,185,84,0.3)" } },
          data: [
            { value: 44.4, name: "第一产业", itemStyle: { color: "#1DB954" } },
            { value: 27.1, name: "第二产业", itemStyle: { color: "#F0A500" } },
            { value: 28.4, name: "第三产业", itemStyle: { color: "#3498DB" } },
          ],
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "36%",
          style: {
            text: "15.29%",
            fontSize: 16,
            fontWeight: "bold",
            fill: "#E8ECF1",
            textAlign: "center",
          },
        },
        {
          type: "text",
          left: "center",
          top: "46%",
          style: {
            text: "GDP 占比",
            fontSize: 9,
            fill: "#8B9BB4",
            textAlign: "center",
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
