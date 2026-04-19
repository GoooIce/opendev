"use client";

import { useMemo, useState } from "react";
import { candidateGenes } from "@/data/genes";
import { crisprEvents } from "@/data/crispr-events";
import { usePlatformStore } from "@/store/platform-store";
import type { CandidateGene } from "@/data/types";

const STATUS_COLORS: Record<CandidateGene["validationStatus"], string> = {
  not_validated: "#8B9BB4",
  in_progress: "#F0A500",
  validated: "#1DB954",
  published: "#3498DB",
};

const STATUS_LABELS: Record<CandidateGene["validationStatus"], string> = {
  not_validated: "未验证",
  in_progress: "验证中",
  validated: "已验证",
  published: "已发表",
};

function EvidenceBadge({ type, value }: { type: string; value: string }) {
  const colors: Record<string, string> = {
    crispr: "var(--color-danger)",
    phenotype: "var(--color-phenome)",
    publication: "var(--color-genomics)",
    score: "var(--color-primary)",
  };
  return (
    <span
      style={{
        fontSize: "clamp(6px, 0.35vw, 8px)",
        padding: "0 0.2vw",
        borderRadius: "2px",
        border: `1px solid ${colors[type] ?? "var(--text-muted)"}40`,
        color: colors[type] ?? "var(--text-muted)",
      }}
    >
      {value}
    </span>
  );
}

function MiniNetwork({ geneName, relatedEvents }: { geneName: string; relatedEvents: number }) {
  const nodeCount = Math.min(relatedEvents + 1, 5);
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
    const r = 16;
    return {
      x: 24 + Math.cos(angle) * r,
      y: 20 + Math.sin(angle) * r,
      isCenter: i === 0,
    };
  });

  return (
    <svg width="48" height="40" viewBox="0 0 48 40" style={{ flexShrink: 0 }}>
      {nodes.slice(1).map((node, i) => (
        <line
          key={i}
          x1={nodes[0].x}
          y1={nodes[0].y}
          x2={node.x}
          y2={node.y}
          stroke="rgba(29,185,84,0.2)"
          strokeWidth="0.5"
        />
      ))}
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r={node.isCenter ? 4 : 2.5}
          fill={node.isCenter ? "#1DB954" : "#F0A500"}
          opacity={node.isCenter ? 1 : 0.6}
        />
      ))}
    </svg>
  );
}

export default function ValidationPanel() {
  const { setSelectedGene } = usePlatformStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const validatedGenes = useMemo(
    () =>
      candidateGenes.filter(
        (g) => g.validationStatus === "validated" || g.validationStatus === "published"
      ),
    []
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { validated: 0, published: 0, in_progress: 0 };
    candidateGenes.forEach((g) => {
      if (g.validationStatus !== "not_validated") {
        counts[g.validationStatus] = (counts[g.validationStatus] ?? 0) + 1;
      }
    });
    return counts;
  }, []);

  const handleClick = (gene: CandidateGene) => {
    setSelectedGene(gene);
    setSelectedId((prev) => (prev === gene.id ? null : gene.id));
  };

  return (
    <div
      className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up"
      style={{ animationDelay: "0.2s" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="glow-text font-bold" style={{ fontSize: "clamp(10px, 0.75vw, 14px)" }}>
          功能验证追踪
        </h3>
        <div className="flex gap-[0.3vw]">
          {(["validated", "published", "in_progress"] as const).map((status) => (
            <span
              key={status}
              style={{
                fontSize: "clamp(6px, 0.38vw, 8px)",
                color: STATUS_COLORS[status],
              }}
            >
              {statusCounts[status] ?? 0} {STATUS_LABELS[status]}
            </span>
          ))}
        </div>
      </div>

      {/* Gene list with evidence */}
      <div className="flex-1 overflow-y-auto mt-[0.3vh] min-h-0" style={{ scrollbarWidth: "thin" }}>
        {validatedGenes.map((gene) => {
          const relatedEvents = crisprEvents.filter((e) => e.geneId === gene.id).length;
          const isSelected = selectedId === gene.id;
          const details = gene.validationDetails;

          return (
            <div key={gene.id}>
              <button
                onClick={() => handleClick(gene)}
                className="w-full text-left flex items-center gap-[0.3vw]"
                style={{
                  padding: "0.25vh 0.2vw",
                  borderBottom: "1px solid rgba(29,185,84,0.05)",
                  background: isSelected ? "rgba(29,185,84,0.08)" : "transparent",
                }}
              >
                <MiniNetwork geneName={gene.name} relatedEvents={relatedEvents} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[0.2vw]">
                    <span
                      className="truncate"
                      style={{
                        fontSize: "clamp(7px, 0.45vw, 10px)",
                        fontWeight: 500,
                        color: STATUS_COLORS[gene.validationStatus],
                        fontStyle: "italic",
                      }}
                    >
                      {gene.name}
                    </span>
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: STATUS_COLORS[gene.validationStatus],
                        flexShrink: 0,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-[0.15vw] mt-[0.1vh]">
                    {details && (
                      <EvidenceBadge type="crispr" value={`${details.crisprEvents} CRISPR`} />
                    )}
                    {details?.phenotypeEffect && (
                      <EvidenceBadge type="phenotype" value={details.phenotypeEffect} />
                    )}
                    {details?.publication && (
                      <EvidenceBadge type="publication" value="已发表" />
                    )}
                  </div>
                </div>
              </button>

              {isSelected && details && (
                <div
                  style={{
                    padding: "0.3vh 0.3vw 0.3vh calc(0.3vw + 48px)",
                    background: "rgba(29,185,84,0.04)",
                    borderBottom: "1px solid rgba(29,185,84,0.08)",
                  }}
                >
                  <div
                    className="flex flex-col gap-[0.1vh]"
                    style={{ fontSize: "clamp(6px, 0.35vw, 8px)", color: "var(--text-secondary)" }}
                  >
                    <span>
                      <b style={{ color: "var(--text-primary)" }}>表型效应：</b>
                      {details.phenotypeEffect}
                    </span>
                    <span>
                      <b style={{ color: "var(--text-primary)" }}>CRISPR 事件：</b>
                      {details.crisprEvents} 次
                    </span>
                    {details.publication && (
                      <span>
                        <b style={{ color: "var(--color-genomics)" }}>文献：</b>
                        {details.publication}
                      </span>
                    )}
                    <span>
                      <b style={{ color: "var(--text-primary)" }}>定位：</b>
                      {gene.annotation.subcellularLocation}
                    </span>
                    <span>
                      <b style={{ color: "var(--text-primary)" }}>通路：</b>
                      {gene.annotation.pathway.join(", ")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="corner-decoration top-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
