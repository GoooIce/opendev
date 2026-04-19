"use client";

import { useEffect, useRef, useCallback } from "react";
import cytoscape, { type NodeSingular } from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import { candidateGenes } from "@/data/genes";
import { usePlatformStore } from "@/store/platform-store";

cytoscape.use(coseBilkent);

const MODULE_COLORS: Record<string, string> = {
  turquoise: "#1DB954",
  blue: "#3498DB",
  brown: "#F0A500",
  yellow: "#F1C40F",
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function buildGraphData() {
  const hubGenes = candidateGenes.filter((g) => g.evidence.networkHub);
  const modules = new Map<string, typeof hubGenes>();
  hubGenes.forEach((g) => {
    const mod = g.evidence.networkHub!.module;
    const list = modules.get(mod) ?? [];
    list.push(g);
    modules.set(mod, list);
  });

  const nodes = hubGenes.map((g) => ({
    data: {
      id: g.id,
      label: g.name,
      degree: g.evidence.networkHub!.degree,
      module: g.evidence.networkHub!.module,
      score: g.agentScore ?? 50,
    },
  }));

  const edges: { data: { id: string; source: string; target: string; weight: number } }[] = [];
  let edgeId = 0;
  modules.forEach((genes, mod) => {
    for (let i = 0; i < genes.length; i++) {
      const connectCount = Math.min(2, genes.length - 1);
      for (let j = i + 1; j <= i + connectCount && j < genes.length; j++) {
        edges.push({
          data: {
            id: `e${edgeId++}`,
            source: genes[i].id,
            target: genes[j].id,
            weight: 0.3 + seededRandom(edgeId * 43 + 17) * 0.7,
          },
        });
      }
    }
  });

  const crossModules = ["turquoise", "blue", "brown", "yellow"];
  for (let m = 0; m < crossModules.length - 1; m++) {
    const srcGenes = modules.get(crossModules[m]);
    const tgtGenes = modules.get(crossModules[m + 1]);
    if (srcGenes?.length && tgtGenes?.length) {
      edges.push({
        data: {
          id: `e${edgeId++}`,
          source: srcGenes[0].id,
          target: tgtGenes[0].id,
          weight: 0.15,
        },
      });
    }
  }

  return { nodes, edges };
}

export default function CoexpressionNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const { setSelectedGene } = usePlatformStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const { nodes, edges } = buildGraphData();

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: "node",
          style: {
            "label": "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": 7,
            "color": "#E8ECF1",
            "text-outline-color": "#0A1628",
            "text-outline-width": 1.5,
            "background-color": (ele: NodeSingular) => {
              const mod = ele.data("module") as string;
              return MODULE_COLORS[mod] ?? "#8B9BB4";
            },
            "width": (ele: NodeSingular) => Math.max(12, Math.min(30, (ele.data("degree") as number) * 0.8)),
            "height": (ele: NodeSingular) => Math.max(12, Math.min(30, (ele.data("degree") as number) * 0.8)),
            "border-width": 0,
            "opacity": 0.85,
          },
        },
        {
          selector: "edge",
          style: {
            "width": (ele: cytoscape.EdgeSingular) => (ele.data("weight") as number) * 2,
            "line-color": "#1E3A5F",
            "opacity": 0.4,
            "curve-style": "haystack",
          },
        },
        {
          selector: "node:active, node:selected",
          style: {
            "border-width": 2,
            "border-color": "#FFD700",
            "opacity": 1,
          },
        },
      ],
      layout: {
        name: "cose-bilkent",
        animate: false,
        nodeRepulsion: 8000,
        idealEdgeLength: 60,
        gravity: 0.3,
        padding: 20,
      } as cytoscape.LayoutOptions,
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const gene = candidateGenes.find((g) => g.id === node.id());
      if (gene) setSelectedGene(gene);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [setSelectedGene]);

  return (
    <div
      className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up"
      style={{ animationDelay: "0.15s" }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="glow-text font-bold"
          style={{ fontSize: "clamp(9px, 0.6vw, 13px)", textAlign: "center" }}
        >
          共表达网络
        </h3>
        <div className="flex gap-[0.3vw]">
          {Object.entries(MODULE_COLORS).map(([mod, color]) => (
            <span
              key={mod}
              className="flex items-center gap-[0.1vw]"
              style={{ fontSize: "clamp(6px, 0.35vw, 8px)", color }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              {mod}
            </span>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 mt-[0.2vh]" />
      <div className="corner-decoration top-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
