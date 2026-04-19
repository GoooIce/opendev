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

  return (
    <div className="data-card w-full h-full relative overflow-hidden">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Background gradient */}
          <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D2137" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0A1628" stopOpacity="0.6" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="root-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Corn plant gradients */}
          <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6b8e23" stopOpacity="1" />
            <stop offset="50%" stopColor="#556b2f" stopOpacity="1" />
            <stop offset="100%" stopColor="#6b8e23" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7cba3d" stopOpacity="1" />
            <stop offset="100%" stopColor="#5a8a2a" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="rootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b7355" stopOpacity="1" />
            <stop offset="100%" stopColor="#6b5344" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#bg-grad)" />

        {/* Ground line */}
        <line
          x1="50" y1="400" x2="550" y2="400"
          stroke="rgba(29,185,84,0.15)" strokeWidth="1" strokeDasharray="4,4"
        />

        {/* === CORN PLANT SVG (detailed, scaled into 600x520 viewBox) === */}
        <g transform="translate(110, 5) scale(0.63)" opacity="0.1">
          {/* Roots */}
          <g fill="none" stroke="#8b7355" strokeWidth="1.5" opacity="0.8">
            <path d="M200 480 Q200 520 198 580 Q196 620 195 650" strokeWidth="3" stroke="#7a6548"/>
            <path d="M200 485 Q180 500 160 520 Q140 545 130 570"/>
            <path d="M198 495 Q175 515 155 540 Q135 570 125 600"/>
            <path d="M197 505 Q170 530 150 560 Q130 595 120 630"/>
            <path d="M196 515 Q165 545 145 580 Q125 620 115 655"/>
            <path d="M195 525 Q160 560 140 600 Q120 640 110 675"/>
            <path d="M200 490 Q185 510 170 535 Q155 565 145 595"/>
            <path d="M199 500 Q180 525 165 555 Q150 590 140 625"/>
            <path d="M198 510 Q175 540 158 575 Q142 615 132 650"/>
            <path d="M197 520 Q170 555 152 595 Q135 638 125 672"/>
            <path d="M202 485 Q220 500 240 520 Q260 545 270 570"/>
            <path d="M203 495 Q225 515 245 540 Q265 570 275 600"/>
            <path d="M204 505 Q230 530 250 560 Q270 595 280 630"/>
            <path d="M205 515 Q235 545 255 580 Q275 620 285 655"/>
            <path d="M206 525 Q240 560 260 600 Q280 640 290 675"/>
            <path d="M201 490 Q215 510 230 535 Q245 565 255 595"/>
            <path d="M202 500 Q220 525 235 555 Q250 590 260 625"/>
            <path d="M203 510 Q225 540 242 575 Q258 615 268 650"/>
            <path d="M204 520 Q230 555 248 595 Q265 638 275 672"/>
            <path d="M130 570 Q125 585 120 600" strokeWidth="0.8"/>
            <path d="M135 575 Q132 592 128 610" strokeWidth="0.8"/>
            <path d="M125 600 Q118 618 112 635" strokeWidth="0.8"/>
            <path d="M270 570 Q275 585 280 600" strokeWidth="0.8"/>
            <path d="M265 575 Q268 592 272 610" strokeWidth="0.8"/>
            <path d="M275 600 Q282 618 288 635" strokeWidth="0.8"/>
          </g>

          {/* Main Stem */}
          <path
            d="M200 480 Q198 450 199 420 Q200 380 201 340 Q202 300 200 260 Q198 220 199 180 Q200 140 200 100 Q200 70 200 50"
            fill="none" stroke="url(#stemGrad)" strokeWidth="8" strokeLinecap="round"
          />

          {/* Stem nodes */}
          <ellipse cx="200" cy="420" rx="6" ry="12" fill="#5a8a2a"/>
          <ellipse cx="200" cy="340" rx="6" ry="12" fill="#5a8a2a"/>
          <ellipse cx="200" cy="260" rx="6" ry="12" fill="#5a8a2a"/>
          <ellipse cx="200" cy="180" rx="6" ry="12" fill="#5a8a2a"/>

          {/* Leaves */}
          <g fill="url(#leafGrad)" stroke="#4a7a2a" strokeWidth="1">
            <path d="M198 460 Q170 440 120 430 Q80 425 50 410 Q70 420 100 425 Q140 432 170 445 Q190 455 198 460 Z"/>
            <path d="M202 460 Q235 445 280 430 Q320 418 350 395 Q330 415 295 430 Q255 445 215 458 Q205 460 202 460 Z"/>
            <path d="M199 380 Q160 360 110 350 Q70 345 45 330 Q65 345 95 355 Q135 368 165 378 Q185 385 199 380 Z"/>
            <path d="M201 380 Q240 365 290 355 Q330 345 365 320 Q345 340 310 355 Q270 370 220 380 Q208 382 201 380 Z"/>
            <path d="M200 300 Q165 280 115 265 Q75 255 50 235 Q70 255 105 270 Q145 285 175 295 Q192 300 200 300 Z"/>
            <path d="M200 300 Q245 280 295 265 Q335 250 365 225 Q345 245 315 265 Q275 285 228 298 Q212 301 200 300 Z"/>
            <path d="M199 220 Q170 200 130 185 Q95 172 70 150 Q90 172 120 190 Q155 210 180 218 Q192 222 199 220 Z"/>
            <path d="M201 220 Q235 200 275 182 Q310 165 340 140 Q320 162 290 185 Q255 208 215 220 Q206 222 201 220 Z"/>
            <path d="M200 145 Q180 125 155 108 Q135 92 120 70 Q138 92 158 112 Q178 132 195 143 Q200 146 200 145 Z"/>
            <path d="M200 145 Q225 122 255 102 Q285 82 315 60 Q292 84 268 108 Q240 132 210 144 Q203 147 200 145 Z"/>
          </g>

          {/* Leaf veins */}
          <g stroke="#4a7a2a" strokeWidth="0.5" fill="none" opacity="0.4">
            <path d="M198 460 Q140 445 70 418"/>
            <path d="M202 460 Q270 440 340 400"/>
            <path d="M199 380 Q130 360 55 332"/>
            <path d="M201 380 Q280 355 360 322"/>
            <path d="M200 300 Q130 278 52 238"/>
            <path d="M200 300 Q280 272 362 228"/>
            <path d="M199 220 Q140 198 78 153"/>
            <path d="M201 220 Q265 195 338 142"/>
          </g>

          {/* Lower Corn Cob (left side) */}
          <g transform="translate(145, 355)">
            <path d="M0 0 Q15 -20 35 -15 Q50 -10 55 10 Q50 30 30 40 Q10 45 -5 30 Q-15 15 0 0 Z" fill="#5a8a2a" stroke="#4a7a2a" strokeWidth="1"/>
            <path d="M-5 5 Q10 -10 30 -5 Q42 0 45 15 Q40 28 25 35 Q8 40 -5 28 Q-12 18 -5 5 Z" fill="#6ba33d" stroke="#4a7a2a" strokeWidth="1"/>
            <path d="M25 -5 Q35 -2 40 8 Q38 15 30 18 Q22 16 20 8 Q20 0 25 -5 Z" fill="#d4a017" stroke="#c49017" strokeWidth="0.5"/>
            <g stroke="#f4a460" strokeWidth="0.8" fill="none" opacity="0.8">
              <path d="M28 -3 Q32 -8 35 -12"/>
              <path d="M32 0 Q38 -5 42 -8"/>
              <path d="M35 4 Q40 0 44 -3"/>
            </g>
          </g>

          {/* Upper Corn Cob (right side) */}
          <g transform="translate(218, 255)">
            <path d="M0 0 Q18 -25 42 -18 Q60 -10 62 15 Q55 38 32 48 Q8 52 -8 35 Q-20 18 0 0 Z" fill="#5a8a2a" stroke="#4a7a2a" strokeWidth="1"/>
            <path d="M-8 8 Q12 -12 38 -5 Q52 2 54 22 Q46 40 28 47 Q6 50 -8 35 Q-18 22 -8 8 Z" fill="#6ba33d" stroke="#4a7a2a" strokeWidth="1"/>
            <path d="M28 -5 Q42 0 48 15 Q45 28 32 32 Q18 30 14 18 Q12 5 28 -5 Z" fill="#e6b800" stroke="#d4a000" strokeWidth="0.5"/>
            <g stroke="#f4a460" strokeWidth="1" fill="none" opacity="0.9">
              <path d="M32 -8 Q38 -15 42 -22"/>
              <path d="M38 -3 Q45 -10 50 -16"/>
              <path d="M42 4 Q50 -2 56 -8"/>
              <path d="M44 10 Q52 6 58 2"/>
              <path d="M30 -6 Q35 -14 38 -20"/>
            </g>
          </g>

          {/* Tassel */}
          <g transform="translate(200, 50)">
            <path d="M0 0 L0 -25" stroke="#6b8e23" strokeWidth="3"/>
            <g stroke="#e07070" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M0 -25 Q0 -35 2 -45 Q4 -55 3 -65"/>
              <path d="M0 -22 Q-10 -30 -18 -38 Q-25 -45 -30 -50"/>
              <path d="M0 -20 Q-8 -28 -14 -35 Q-20 -42 -24 -48"/>
              <path d="M-2 -18 Q-12 -24 -20 -30 Q-28 -36 -32 -40"/>
              <path d="M0 -22 Q10 -30 18 -38 Q25 -45 30 -50"/>
              <path d="M0 -20 Q8 -28 14 -35 Q20 -42 24 -48"/>
              <path d="M2 -18 Q12 -24 20 -30 Q28 -36 32 -40"/>
            </g>
            <g fill="#f08080" opacity="0.8">
              <circle cx="3" cy="-66" r="2"/>
              <circle cx="-31" cy="-51" r="1.8"/>
              <circle cx="-25" cy="-49" r="1.8"/>
              <circle cx="-33" cy="-41" r="1.5"/>
              <circle cx="31" cy="-51" r="1.8"/>
              <circle cx="25" cy="-49" r="1.8"/>
              <circle cx="33" cy="-41" r="1.5"/>
            </g>
          </g>

          {/* Shadow */}
          <ellipse cx="200" cy="685" rx="120" ry="8" fill="#000000" opacity="0.08"/>
        </g>

        {/* === LOGO PNG OVERLAY with breathing effect === */}
        <image
          href="/corn-logo.png"
          x="110"
          y="5"
          width="252"
          height="441"
          opacity="0.85"
          className="corn-logo-breathe"
        />

        {/* === PROCESS CONNECTION LINES === */}
        {PROCESS_CONNECTIONS.map(([fromId, toId]) => {
          const from = biologyProcesses.find((p) => p.id === fromId);
          const to = biologyProcesses.find((p) => p.id === toId);
          if (!from || !to) return null;

          const x1 = from.position.x * SVG_W;
          const y1 = from.position.y * SVG_H;
          const x2 = to.position.x * SVG_W;
          const y2 = to.position.y * SVG_H;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;

          const isHighlighted =
            hoveredProcess === fromId ||
            hoveredProcess === toId ||
            selectedProcess === fromId ||
            selectedProcess === toId;

          return (
            <g key={`${fromId}-${toId}`}>
              {/* Base line */}
              <path
                d={`M${x1},${y1} Q${mx},${my - 20} ${x2},${y2}`}
                stroke={isHighlighted ? "var(--color-primary)" : "rgba(29,185,84,0.2)"}
                strokeWidth={isHighlighted ? 3 : 2}
                fill="none"
              />
              {/* Flowing particle overlay */}
              <path
                d={`M${x1},${y1} Q${mx},${my - 20} ${x2},${y2}`}
                stroke={isHighlighted ? "var(--color-primary)" : "rgba(29,185,84,0.35)"}
                strokeWidth={2}
                fill="none"
                strokeDasharray="6 14"
                className="process-flow-line"
              />
            </g>
          );
        })}

        {/* === PROCESS NODES === */}
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
