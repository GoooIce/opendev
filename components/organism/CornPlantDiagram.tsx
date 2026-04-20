"use client";

import { useCallback } from "react";
import { biologyProcesses } from "@/data/processes";
import { usePlatformStore } from "@/store/platform-store";
import type { ProcessId, BiologyProcess } from "@/data/types";
import ProcessNode from "./ProcessNode";
import NitrogenSlider from "./NitrogenSlider";
import PathwayViewer from "./PathwayViewer";

const SVG_W = 600;
const SVG_H = 520;

const PROCESS_CONNECTIONS: [ProcessId, ProcessId][] = [
  ["uptake", "assimilation"],
  ["uptake", "metabolism"],
  ["assimilation", "metabolism"],
  ["sensing", "regulation"],
  ["regulation", "metabolism"],
  ["metabolism", "remobilization"],
];

export default function CornPlantDiagram() {
  const {
    nitrogenLevel,
    selectedProcess,
    hoveredProcess,
    setSelectedProcess,
    setHoveredProcess,
  } = usePlatformStore();

  const getActivity = useCallback(
    (process: BiologyProcess) => process.activityLevels[nitrogenLevel],
    [nitrogenLevel]
  );

  const handleProcessClick = useCallback(
    (id: ProcessId) => {
      setSelectedProcess(selectedProcess === id ? null : id);
    },
    [selectedProcess, setSelectedProcess]
  );

  const anyActive =
    hoveredProcess !== null || selectedProcess !== null;

  return (
    <div className="data-card w-full h-full relative overflow-hidden">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="center-glow" cx="50%" cy="46%" r="45%">
            <stop offset="0%" stopColor="#1DB954" stopOpacity="0.07" />
            <stop offset="50%" stopColor="#1DB954" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#0A1628" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="soil-glow" cx="50%" cy="100%" r="30%">
            <stop offset="0%" stopColor="#8B7355" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0A1628" stopOpacity="0" />
          </radialGradient>

          <pattern
            id="hex-grid"
            width="24"
            height="20.8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(15)"
          >
            <polygon
              points="12,0 24,5.2 24,15.6 12,20.8 0,15.6 0,5.2"
              fill="none"
              stroke="rgba(29,185,84,0.04)"
              strokeWidth="0.4"
            />
          </pattern>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="line-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="plant-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="stem-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1DB954" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="leaf-gradient-l" x1="1" y1="0" x2="0" y2="0.5">
            <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1DB954" stopOpacity="0.04" />
          </linearGradient>

          <linearGradient id="leaf-gradient-r" x1="0" y1="0" x2="1" y2="0.5">
            <stop offset="0%" stopColor="#2ECC71" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1DB954" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Background layers */}
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#0A1628" opacity="0.3" />
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#hex-grid)" />
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#center-glow)" />
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#soil-glow)" />

        {/* Ground line */}
        <line
          x1="30" y1="398" x2="570" y2="398"
          stroke="rgba(29,185,84,0.1)" strokeWidth="1" strokeDasharray="8,6"
        />

        {/* ===== STYLIZED CORN PLANT SILHOUETTE ===== */}
        <g opacity={anyActive ? 0.08 : 0.14} style={{ transition: "opacity 0.6s ease" }}>
          {/* Roots */}
          <g fill="none" stroke="#8B7355" strokeWidth="1.2" opacity="0.6">
            <path d="M300,408 C285,430 265,448 240,468" />
            <path d="M300,408 C290,440 275,458 255,478" />
            <path d="M298,412 C288,442 270,462 245,485" />
            <path d="M300,408 C315,430 335,448 360,468" />
            <path d="M300,408 C310,440 325,458 345,478" />
            <path d="M302,412 C312,442 330,462 355,485" />
            {/* Root hairs */}
            <path d="M255,458 C248,462 240,465 232,468" strokeWidth="0.6" />
            <path d="M260,472 C252,478 245,482 238,485" strokeWidth="0.6" />
            <path d="M345,458 C352,462 360,465 368,468" strokeWidth="0.6" />
            <path d="M340,472 C348,478 355,482 362,485" strokeWidth="0.6" />
          </g>

          {/* Main stem */}
          <path
            d="M300,405 C300,370 299,330 299,290 C298,250 300,210 300,170 C300,135 300,105 300,75"
            fill="none" stroke="url(#stem-gradient)" strokeWidth="4" strokeLinecap="round"
          />

          {/* Stem nodes */}
          <g fill="#2ECC71" opacity="0.4">
            <ellipse cx="299" cy="370" rx="4" ry="8" />
            <ellipse cx="299" cy="290" rx="4" ry="8" />
            <ellipse cx="300" cy="210" rx="4" ry="8" />
            <ellipse cx="300" cy="150" rx="4" ry="8" />
          </g>

          {/* Left leaves */}
          <g fill="none" strokeWidth="2.5" strokeLinecap="round">
            <path d="M299,365 C268,348 225,340 180,345" stroke="url(#leaf-gradient-l)" />
            <path d="M299,295 C260,275 215,268 168,272" stroke="url(#leaf-gradient-l)" />
            <path d="M299,225 C268,205 232,198 190,202" stroke="url(#leaf-gradient-l)" />
            <path d="M300,160 C278,140 248,132 212,138" stroke="url(#leaf-gradient-l)" />
          </g>

          {/* Right leaves */}
          <g fill="none" strokeWidth="2.5" strokeLinecap="round">
            <path d="M299,365 C332,348 375,340 420,345" stroke="url(#leaf-gradient-r)" />
            <path d="M299,295 C340,275 385,268 432,272" stroke="url(#leaf-gradient-r)" />
            <path d="M299,225 C332,205 368,198 410,202" stroke="url(#leaf-gradient-r)" />
            <path d="M300,160 C325,140 355,132 392,138" stroke="url(#leaf-gradient-r)" />
          </g>

          {/* Corn cob (lower left) */}
          <g transform="translate(270, 332) rotate(-15)">
            <ellipse rx="10" ry="20" fill="#F0A500" opacity="0.25" />
            <ellipse rx="7" ry="16" fill="#E6B800" opacity="0.2" />
          </g>

          {/* Corn cob (upper right) */}
          <g transform="translate(332, 262) rotate(12)">
            <ellipse rx="10" ry="20" fill="#F0A500" opacity="0.25" />
            <ellipse rx="7" ry="16" fill="#E6B800" opacity="0.2" />
          </g>

          {/* Tassel */}
          <g fill="none" stroke="#D4764E" strokeWidth="1.5" opacity="0.5">
            <path d="M300,75 C300,55 302,38 305,22" />
            <path d="M300,75 C293,55 283,40 272,28" />
            <path d="M300,75 C307,55 317,40 328,28" />
            <path d="M300,72 C295,50 288,35 280,22" />
            <path d="M300,72 C305,50 312,35 320,22" />
          </g>

          {/* Tassel dots */}
          <g fill="#E07070" opacity="0.35">
            <circle cx="305" cy="20" r="2" />
            <circle cx="272" cy="26" r="1.5" />
            <circle cx="328" cy="26" r="1.5" />
          </g>
        </g>

        {/* ===== CENTRAL ENERGY RING ===== */}
        <circle
          cx="300" cy="260" r="80"
          fill="none" stroke="rgba(29,185,84,0.04)" strokeWidth="1"
          strokeDasharray="4,8"
        />
        <circle
          cx="300" cy="260" r="140"
          fill="none" stroke="rgba(29,185,84,0.03)" strokeWidth="0.5"
          strokeDasharray="2,12"
        />

        {/* ===== PROCESS CONNECTION LINES ===== */}
        {PROCESS_CONNECTIONS.map(([fromId, toId]) => {
          const from = biologyProcesses.find((p) => p.id === fromId);
          const to = biologyProcesses.find((p) => p.id === toId);
          if (!from || !to) return null;

          const x1 = from.position.x * SVG_W;
          const y1 = from.position.y * SVG_H;
          const x2 = to.position.x * SVG_W;
          const y2 = to.position.y * SVG_H;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2 - 15;

          const isHighlighted =
            hoveredProcess === fromId ||
            hoveredProcess === toId ||
            selectedProcess === fromId ||
            selectedProcess === toId;

          return (
            <g key={`${fromId}-${toId}`}>
              {isHighlighted && (
                <path
                  d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                  stroke="var(--color-primary)"
                  strokeWidth="8"
                  fill="none"
                  opacity="0.1"
                  filter="url(#line-glow)"
                />
              )}
              <path
                d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                stroke={isHighlighted ? "rgba(29,185,84,0.4)" : "rgba(29,185,84,0.1)"}
                strokeWidth={isHighlighted ? 2 : 1.2}
                fill="none"
              />
              <path
                d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                stroke={isHighlighted ? "var(--color-primary)" : "rgba(29,185,84,0.25)"}
                strokeWidth={1.5}
                fill="none"
                strokeDasharray="3 18"
                className="process-flow-line"
              />
            </g>
          );
        })}

        {/* ===== PROCESS NODES ===== */}
        {biologyProcesses.map((process) => (
          <ProcessNode
            key={process.id}
            process={process}
            activity={getActivity(process)}
            isSelected={selectedProcess === process.id}
            isHovered={hoveredProcess === process.id}
            onClick={() => handleProcessClick(process.id)}
            onHover={(hovered) => setHoveredProcess(hovered ? process.id : null)}
          />
        ))}
      </svg>

      {/* Nitrogen slider overlay */}
      <div className="absolute bottom-[6px] left-[10px] right-[10px]">
        <NitrogenSlider />
      </div>

      {/* Pathway viewer overlay */}
      {selectedProcess && (
        <PathwayViewer
          processId={selectedProcess}
          onClose={() => setSelectedProcess(null)}
        />
      )}

      {/* Corner decorations */}
      <div className="corner-decoration top-left" />
      <div className="corner-decoration top-right" />
      <div className="corner-decoration bottom-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
