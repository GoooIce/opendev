"use client";

import type { BiologyProcess } from "@/data/types";

interface ProcessNodeProps {
  process: BiologyProcess;
  activity: number;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

const NODE_RADIUS = 32;

export default function ProcessNode({
  process,
  activity,
  isSelected,
  isHovered,
  onClick,
  onHover,
}: ProcessNodeProps) {
  const cx = process.position.x * 600;
  const cy = process.position.y * 520;

  const activityPercent = Math.round(activity * 100);
  const circumference = 2 * Math.PI * NODE_RADIUS;
  const strokeDashoffset = circumference * (1 - activity);

  const scale = isSelected ? 1.1 : isHovered ? 1.05 : 1;
  const opacity = isSelected || isHovered ? 1 : 0.85;

  return (
    <g
      transform={`translate(${cx},${cy}) scale(${scale})`}
      style={{
        cursor: "pointer",
        transition: "transform 0.3s ease, opacity 0.3s ease",
        opacity,
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Outer glow ring */}
      {(isSelected || isHovered) && (
        <circle
          r={NODE_RADIUS + 6}
          fill="none"
          stroke={process.color}
          strokeWidth="1"
          opacity="0.3"
          filter="url(#glow)"
        />
      )}

      {/* Background circle */}
      <circle
        r={NODE_RADIUS}
        fill="#0D2137"
        stroke={process.color}
        strokeWidth={isSelected ? 2.5 : 1.5}
        opacity="0.9"
      />

      {/* Activity arc */}
      <circle
        r={NODE_RADIUS - 4}
        fill="none"
        stroke={process.color}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90)`}
        opacity="0.8"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />

      {/* Icon area */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={process.color}
        fontSize="16"
        y={-4}
      >
        {getIcon(process.icon)}
      </text>

      {/* Label */}
      <text
        textAnchor="middle"
        y={NODE_RADIUS + 14}
        fill={isSelected || isHovered ? "#E8ECF1" : "#8B9BB4"}
        fontSize="10"
        fontWeight={isSelected ? 600 : 400}
      >
        {process.name}
      </text>

      {/* Activity percentage */}
      <text
        textAnchor="middle"
        y={NODE_RADIUS + 26}
        fill={process.color}
        fontSize="9"
        opacity="0.7"
      >
        {activityPercent}%
      </text>

      {/* Gene count badge */}
      <g transform={`translate(${NODE_RADIUS - 4}, ${-NODE_RADIUS + 4})`}>
        <circle r="8" fill="#0A1628" stroke={process.color} strokeWidth="0.5" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={process.color}
          fontSize="7"
        >
          {process.relatedGenes}
        </text>
      </g>
    </g>
  );
}

function getIcon(icon: string): string {
  const icons: Record<string, string> = {
    roots: "⊕",
    leaf: "❋",
    arrow: "⟿",
    signal: "◉",
    gear: "⚙",
    dna: "§",
  };
  return icons[icon] || "●";
}
