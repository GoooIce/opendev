"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import CornPlantDiagram from "@/components/organism/CornPlantDiagram";

const MapContainer = dynamic(
  () => import("@/components/map/MapContainer"),
  { ssr: false }
);

const SLIDES = [
  { id: "map", label: "试验站点分布" },
  { id: "plant", label: "氮代谢过程" },
] as const;

const INTERVAL = 15_000;

export default function CenterCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return (
    <div className="relative w-full h-full">
      {/* Slide content */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: index === 0 ? 1 : 0,
            transition: "opacity 0.8s ease",
            pointerEvents: index === 0 ? "auto" : "none",
          }}
        >
          <MapContainer />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: index === 1 ? 1 : 0,
            transition: "opacity 0.8s ease",
            pointerEvents: index === 1 ? "auto" : "none",
          }}
        >
          <CornPlantDiagram />
        </div>
      </div>

      {/* Indicator dots */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          right: "12px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          zIndex: 20,
        }}
      >
        {SLIDES.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? "18px" : "6px",
              height: "6px",
              borderRadius: "3px",
              background: i === index ? "var(--color-primary)" : "rgba(29,185,84,0.3)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              padding: 0,
            }}
            title={slide.label}
          />
        ))}
        <button
          onClick={togglePause}
          style={{
            marginLeft: "4px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontSize: "clamp(8px, 0.5vw, 11px)",
            padding: "2px 4px",
            opacity: paused ? 1 : 0.5,
          }}
        >
          {paused ? "▶" : "❚❚"}
        </button>
      </div>
    </div>
  );
}
