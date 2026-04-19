"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { candidateGenes } from "@/data/genes";
import { usePlatformStore } from "@/store/platform-store";
import type { CandidateGene } from "@/data/types";

type TargetTrait = "NUE" | "uptake" | "utilization" | "lowN_tolerance" | "highN_efficiency";

interface TraitOption {
  id: TargetTrait;
  label: string;
}

const TRAIT_OPTIONS: TraitOption[] = [
  { id: "NUE", label: "NUE整体" },
  { id: "uptake", label: "氮吸收效率" },
  { id: "utilization", label: "氮利用效率" },
  { id: "lowN_tolerance", label: "低氮耐受" },
  { id: "highN_efficiency", label: "高氮高效" },
];

const EVIDENCE_LABELS: Record<string, string> = {
  gwas: "GWAS",
  differentialExpression: "差异表达",
  networkHub: "网络枢纽",
  conservation: "保守性",
};

const EVIDENCE_COLORS: Record<string, string> = {
  gwas: "var(--color-genomics)",
  differentialExpression: "var(--color-transcript)",
  networkHub: "var(--color-protein)",
  conservation: "var(--color-metabolite)",
};

function getEvidenceTags(gene: CandidateGene): { key: string; label: string; color: string }[] {
  const tags: { key: string; label: string; color: string }[] = [];
  const ev = gene.evidence;
  if (ev.gwas) tags.push({ key: "gwas", label: EVIDENCE_LABELS.gwas, color: EVIDENCE_COLORS.gwas });
  if (ev.differentialExpression) tags.push({ key: "differentialExpression", label: EVIDENCE_LABELS.differentialExpression, color: EVIDENCE_COLORS.differentialExpression });
  if (ev.networkHub) tags.push({ key: "networkHub", label: EVIDENCE_LABELS.networkHub, color: EVIDENCE_COLORS.networkHub });
  if (ev.conservation) tags.push({ key: "conservation", label: EVIDENCE_LABELS.conservation, color: EVIDENCE_COLORS.conservation });
  return tags;
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? "#1DB954" : pct >= 60 ? "#F0A500" : "#8B9BB4";
  return (
    <div style={{ width: "100%", height: "3px", borderRadius: "2px", background: "rgba(29,185,84,0.1)" }}>
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: "2px", background: color, transition: "width 0.3s ease" }} />
    </div>
  );
}

export default function AgentPanel() {
  const { setSelectedGene, setAgentResults } = usePlatformStore();
  const [targetTrait, setTargetTrait] = useState<TargetTrait>("NUE");
  const [minScore, setMinScore] = useState(50);
  const [expandedGene, setExpandedGene] = useState<string | null>(null);

  const rankedGenes = useMemo(() => {
    const filtered = candidateGenes
      .filter((g) => (g.agentScore ?? 0) >= minScore)
      .sort((a, b) => (b.agentScore ?? 0) - (a.agentScore ?? 0));
    return filtered.slice(0, 15);
  }, [minScore]);

  useEffect(() => {
    const filtered = candidateGenes
      .filter((g) => (g.agentScore ?? 0) >= minScore)
      .sort((a, b) => (b.agentScore ?? 0) - (a.agentScore ?? 0));
    setAgentResults(filtered);
  }, [minScore, setAgentResults]);

  const handleGeneClick = useCallback(
    (gene: CandidateGene) => {
      setSelectedGene(gene);
      setExpandedGene((prev) => (prev === gene.id ? null : gene.id));
    },
    [setSelectedGene]
  );

  const traitIdx = TRAIT_OPTIONS.findIndex((t) => t.id === targetTrait);

  return (
    <div className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="glow-text font-bold" style={{ fontSize: "clamp(10px, 0.75vw, 14px)" }}>
          AI 基因筛选 Agent
        </h3>
        <span style={{ fontSize: "clamp(7px, 0.4vw, 9px)", color: "var(--text-secondary)" }}>
          {rankedGenes.length} / {candidateGenes.length}
        </span>
      </div>

      {/* Filter config */}
      <div className="flex flex-col gap-[0.2vh] mt-[0.3vh]">
        <div className="flex items-center gap-[0.3vw]">
          <span style={{ fontSize: "clamp(7px, 0.4vw, 9px)", color: "var(--text-secondary)", width: "clamp(28px, 2.2vw, 38px)", flexShrink: 0 }}>
            目标性状
          </span>
          <div className="flex-1 flex gap-[1px] overflow-hidden">
            {TRAIT_OPTIONS.map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => setTargetTrait(opt.id)}
                style={{
                  flex: 1,
                  padding: "0.15vh 0",
                  fontSize: "clamp(6px, 0.38vw, 8px)",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                  color: i === traitIdx ? "#0A1628" : "var(--text-secondary)",
                  background: i === traitIdx ? "var(--color-primary)" : "rgba(13,33,55,0.6)",
                  transition: "all 0.2s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-[0.3vw]">
          <span style={{ fontSize: "clamp(7px, 0.4vw, 9px)", color: "var(--text-secondary)", width: "clamp(28px, 2.2vw, 38px)", flexShrink: 0 }}>
            最低分值
          </span>
          <input
            type="range"
            min={0}
            max={99}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ flex: 1, height: "3px", accentColor: "var(--color-primary)" }}
          />
          <span style={{ fontSize: "clamp(7px, 0.4vw, 9px)", color: "var(--color-primary)", width: "clamp(18px, 1.4vw, 24px)", textAlign: "right" }}>
            {minScore}
          </span>
        </div>
      </div>

      {/* Ranked gene list */}
      <div className="flex-1 overflow-y-auto mt-[0.3vh] min-h-0" style={{ scrollbarWidth: "thin" }}>
        {rankedGenes.map((gene, idx) => {
          const isExpanded = expandedGene === gene.id;
          const tags = getEvidenceTags(gene);
          return (
            <div key={gene.id}>
              <button
                onClick={() => handleGeneClick(gene)}
                className="w-full text-left flex items-center gap-[0.3vw] transition-colors duration-150"
                style={{
                  padding: "0.25vh 0.3vw",
                  borderBottom: "1px solid rgba(29,185,84,0.05)",
                  background: isExpanded ? "rgba(29,185,84,0.08)" : "transparent",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(7px, 0.38vw, 9px)",
                    color: idx < 3 ? "var(--color-accent)" : "var(--text-secondary)",
                    fontWeight: idx < 3 ? 700 : 400,
                    width: "clamp(12px, 0.9vw, 16px)",
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[0.2vw]">
                    <span
                      className="truncate"
                      style={{
                        fontSize: "clamp(7px, 0.45vw, 10px)",
                        fontWeight: 500,
                        color: "var(--color-primary)",
                        fontStyle: "italic",
                      }}
                    >
                      {gene.name}
                    </span>
                    <span style={{ fontSize: "clamp(6px, 0.35vw, 8px)", color: "var(--text-secondary)" }}>
                      {gene.family}
                    </span>
                  </div>
                  <ScoreBar value={gene.agentScore ?? 0} />
                </div>
                <span
                  style={{
                    fontSize: "clamp(8px, 0.48vw, 11px)",
                    fontWeight: 700,
                    color: (gene.agentScore ?? 0) >= 80 ? "var(--color-primary)" : (gene.agentScore ?? 0) >= 60 ? "var(--color-accent)" : "var(--text-secondary)",
                    flexShrink: 0,
                  }}
                >
                  {gene.agentScore ?? 0}
                </span>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div
                  style={{
                    padding: "0.3vh 0.4vw 0.3vh calc(0.9vw + 0.3vw)",
                    background: "rgba(29,185,84,0.04)",
                    borderBottom: "1px solid rgba(29,185,84,0.08)",
                  }}
                >
                  <div className="flex flex-wrap gap-[0.15vw]">
                    {tags.map((tag) => (
                      <span
                        key={tag.key}
                        style={{
                          fontSize: "clamp(6px, 0.35vw, 8px)",
                          padding: "0 0.2vw",
                          borderRadius: "2px",
                          border: `1px solid ${tag.color}40`,
                          color: tag.color,
                        }}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: "clamp(6px, 0.35vw, 8px)",
                      color: "var(--text-secondary)",
                      marginTop: "0.2vh",
                      lineHeight: 1.4,
                    }}
                  >
                    {gene.agentReasoning}
                  </p>
                  {gene.evidence.conservation && (
                    <div className="flex gap-[0.4vw]" style={{ marginTop: "0.15vh" }}>
                      <span style={{ fontSize: "clamp(6px, 0.33vw, 7px)", color: "var(--text-muted)" }}>
                        At: {gene.evidence.conservation.orthoArabidopsis}
                      </span>
                      <span style={{ fontSize: "clamp(6px, 0.33vw, 7px)", color: "var(--text-muted)" }}>
                        Os: {gene.evidence.conservation.orthoRice}
                      </span>
                      <span style={{ fontSize: "clamp(6px, 0.33vw, 7px)", color: "var(--color-metabolite)" }}>
                        {((gene.evidence.conservation.similarity ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
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
