"use client";

import { biologyProcesses } from "@/data/processes";
import { candidateGenes } from "@/data/genes";
import { usePlatformStore } from "@/store/platform-store";
import type { ProcessId } from "@/data/types";

interface PathwayViewerProps {
  processId: ProcessId;
  onClose: () => void;
}

const PROCESS_GENE_MAP: Record<ProcessId, string[]> = {
  uptake: ["ZmNRT1.1", "ZmNRT2.1", "ZmNRT3.1", "ZmAMT1.1", "ZmAMT2.1", "ZmNPF6.6", "ZmNRT1.5"],
  assimilation: ["ZmGS1.3", "ZmGOGAT1", "ZmAS1", "ZmGDH1", "ZmAAP2", "ZmLHT1", "ZmGS1.5"],
  remobilization: ["ZmNRT1.5", "ZmNPF7.3", "ZmAAP3", "ZmGS2.2", "ZmGOGAT4", "ZmNPF1.1"],
  sensing: ["ZmNLP5", "ZmNIN-like2", "ZmNLP7", "ZmNIN-like3", "ZmNLP3", "ZmNLP1"],
  metabolism: ["ZmGS1.3", "ZmGDH1", "ZmGOGAT1", "ZmAS3", "ZmAAP4", "ZmLHT2", "ZmGDH3", "ZmAS4"],
  regulation: ["ZmDof1", "ZmMYB72", "ZmWRKY45", "ZmbZIP33", "ZmDof2", "ZmMYB108", "ZmWRKY21"],
};

export default function PathwayViewer({ processId, onClose }: PathwayViewerProps) {
  const process = biologyProcesses.find((p) => p.id === processId);
  const geneNames = PROCESS_GENE_MAP[processId] || [];
  const relatedGenes = candidateGenes.filter((g) =>
    geneNames.includes(g.name)
  );
  const { setSelectedGene } = usePlatformStore();

  if (!process) return null;

  return (
    <div
      className="absolute top-[8px] right-[8px] w-[280px] max-h-[85%] overflow-y-auto"
      style={{
        background: "rgba(10, 22, 40, 0.95)",
        border: `1px solid ${process.color}`,
        borderRadius: "6px",
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 12px ${process.color}30`,
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-[10px] py-[8px]"
        style={{
          borderBottom: `1px solid ${process.color}40`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "clamp(11px, 0.75vw, 14px)",
              color: process.color,
              fontWeight: 600,
            }}
          >
            {process.name}
          </div>
          <div
            style={{
              fontSize: "clamp(8px, 0.5vw, 11px)",
              color: "var(--text-secondary)",
              marginTop: "2px",
              lineHeight: "1.3",
            }}
          >
            {process.description}
          </div>
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer"
          style={{
            color: "var(--text-secondary)",
            fontSize: "16px",
            lineHeight: "1",
            padding: "2px 4px",
          }}
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div
        className="flex gap-[8px] px-[10px] py-[6px]"
        style={{
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <StatBadge label="相关基因" value={String(process.relatedGenes)} color={process.color} />
        <StatBadge label="KEGG通路" value={String(process.pathways.length)} color={process.color} />
      </div>

      {/* Gene list */}
      <div className="px-[10px] py-[6px]">
        <div
          style={{
            fontSize: "clamp(9px, 0.55vw, 11px)",
            color: "var(--text-secondary)",
            marginBottom: "4px",
          }}
        >
          关键候选基因
        </div>
        <div className="flex flex-col gap-[3px]">
          {relatedGenes.length > 0 ? (
            relatedGenes.slice(0, 8).map((gene) => (
              <button
                key={gene.id}
                onClick={() => setSelectedGene(gene)}
                className="flex items-center justify-between cursor-pointer transition-colors duration-150"
                style={{
                  padding: "3px 6px",
                  borderRadius: "3px",
                  fontSize: "clamp(9px, 0.5vw, 11px)",
                  background: "transparent",
                  border: "1px solid transparent",
                  textAlign: "left",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${process.color}10`;
                  e.currentTarget.style.borderColor = `${process.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <span style={{ color: "#E8ECF1" }}>{gene.name}</span>
                <span style={{ color: process.color, fontSize: "clamp(8px, 0.45vw, 10px)" }}>
                  Score: {gene.agentScore}
                </span>
              </button>
            ))
          ) : (
            <div style={{ fontSize: "clamp(9px, 0.5vw, 11px)", color: "var(--text-secondary)" }}>
              {geneNames.slice(0, 6).map((name) => (
                <div key={name} style={{ padding: "2px 0" }}>
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pathway placeholder */}
      <div
        className="mx-[10px] mb-[8px] p-[6px]"
        style={{
          background: "rgba(29, 185, 84, 0.05)",
          borderRadius: "3px",
          border: "1px solid var(--border-color)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "clamp(8px, 0.45vw, 10px)",
            color: "var(--text-secondary)",
          }}
        >
          KEGG 通路图: {process.pathways.join(", ")}
        </span>
      </div>
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-[4px]"
      style={{
        padding: "2px 6px",
        borderRadius: "3px",
        background: `${color}10`,
      }}
    >
      <span style={{ fontSize: "clamp(8px, 0.45vw, 10px)", color }}>
        {value}
      </span>
      <span
        style={{
          fontSize: "clamp(8px, 0.45vw, 10px)",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
