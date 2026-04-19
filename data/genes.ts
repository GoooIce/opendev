import type { CandidateGene } from "./types";

const geneFamilies = [
  "NRT", "NRT1", "NRT2", "AMT", "GS", "GOGAT", "AS", "GDH",
  "NIA", "NII", "ALT", "AAP", "LHT", "NPF", "TFL", "Dof",
  "MYB", "WRKY", "bZIP", "NIN-like",
];

const goTerms = [
  "GO:0015672", "GO:0015706", "GO:0042128", "GO:0006520",
  "GO:0006807", "GO:0006950", "GO:0008270", "GO:0003700",
  "GO:0010467", "GO:0005506", "GO:0003824", "GO:0005215",
];

const pathways = [
  "map00910", "map00250", "map00340", "map04075", "map03040",
];

const chromosomes = Array.from({ length: 10 }, (_, i) => i + 1);
const statuses: CandidateGene["validationStatus"][] = [
  "not_validated", "in_progress", "validated", "published",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededBetween(min: number, max: number, seed: number): number {
  return Math.round((seededRandom(seed) * (max - min) + min) * 100) / 100;
}

function generateGene(index: number): CandidateGene {
  const family = geneFamilies[index % geneFamilies.length];
  const chr = chromosomes[index % chromosomes.length];
  const start = Math.floor(seededRandom(index * 7 + 1) * 200000000) + 1000;
  const hasGwas = seededRandom(index * 13 + 2) > 0.3;
  const hasDE = seededRandom(index * 17 + 3) > 0.3;
  const hasNetwork = seededRandom(index * 23 + 4) > 0.4;
  const hasConservation = seededRandom(index * 29 + 5) > 0.4;

  return {
    id: `Zm${family}${String(index + 1).padStart(5, "0")}`,
    name: `Zm${family}${index + 1}`,
    alias: index % 3 === 0 ? [`GRMZM${index}G${String(index).padStart(6, "0")}`] : [],
    family,
    chromosome: chr,
    position: { start, end: start + Math.floor(seededRandom(index * 11 + 6) * 5000) + 500 },
    evidence: {
      gwas: hasGwas
        ? {
            pValue: Math.pow(10, -seededBetween(3, 8, index * 31 + 7)),
            leadSNP: `SNP_chr${chr}_${start + 200}`,
            trait: ["NUE", "leafN", "grainN", "rootN"][index % 4],
          }
        : undefined,
      differentialExpression: hasDE
        ? {
            log2FC: seededBetween(-4, 6, index * 37 + 8),
            padj: Math.pow(10, -seededBetween(1, 5, index * 41 + 9)),
            tissue: ["root", "leaf", "kernel", "tassel"][index % 4],
          }
        : undefined,
      networkHub: hasNetwork
        ? {
            degree: Math.floor(seededRandom(index * 43 + 10) * 40) + 5,
            betweenness: seededBetween(0.01, 0.5, index * 47 + 11),
            module: ["turquoise", "blue", "brown", "yellow"][index % 4],
          }
        : undefined,
      conservation: hasConservation
        ? {
            orthoArabidopsis: `AT${index}G${String(index * 100).padStart(5, "0")}`,
            orthoRice: `LOC_Os${chr}g${String(index * 1000).padStart(5, "0")}`,
            similarity: seededBetween(0.55, 0.98, index * 53 + 12),
          }
        : undefined,
    },
    annotation: {
      goTerms: goTerms.slice(index % 4, (index % 4) + 3),
      pathway: [pathways[index % pathways.length]],
      subcellularLocation: ["cytoplasm", "membrane", "nucleus", "chloroplast"][index % 4],
      description: `${family}家族基因，参与玉米氮素${["吸收", "同化", "转运", "信号"][index % 4]}调控`,
    },
    validationStatus: statuses[index % statuses.length],
    validationDetails:
      statuses[index % statuses.length] === "validated" ||
      statuses[index % statuses.length] === "published"
        ? {
            crisprEvents: Math.floor(seededRandom(index * 59 + 13) * 3) + 1,
            phenotypeEffect: ["NUE提升12%", "根系构型改变", "穗粒数增加8%"][index % 3],
            publication:
              statuses[index % statuses.length] === "published"
                ? `Plant Physiol. 2024;${index + 1}:100-${100 + index}`
                : undefined,
          }
        : undefined,
    agentScore: Math.round(seededBetween(50, 99, index * 61 + 14)),
    agentReasoning: `多组学证据支持：${[
      "GWAS显著关联",
      "低氮诱导差异表达",
      "共表达网络枢纽节点",
      "跨物种保守性高",
    ]
      .slice(0, (index % 4) + 1)
      .join("；")}`,
  };
}

export const candidateGenes: CandidateGene[] = Array.from(
  { length: 50 },
  (_, i) => generateGene(i)
);
