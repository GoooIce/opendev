import type { ExpressionRecord } from "./types";

const tissues = ["root", "leaf", "stem", "kernel", "tassel"] as const;
const timepoints = ["0h", "3h", "6h", "12h", "24h", "48h"] as const;
const geneNames = [
  "ZmNRT1.1", "ZmNRT1.2", "ZmNRT2.1", "ZmNRT2.2", "ZmNRT3.1",
  "ZmAMT1.1", "ZmAMT1.2", "ZmAMT1.3", "ZmAMT2.1", "ZmGS1.1",
  "ZmGS1.2", "ZmGS1.3", "ZmGS1.4", "ZmGS2.1", "ZmGOGAT1",
  "ZmGOGAT2", "ZmGDH1", "ZmGDH2", "ZmNIA1", "ZmNIA2",
  "ZmNII1", "ZmAS1", "ZmAS2", "ZmAAP1", "ZmAAP2",
  "ZmLHT1", "ZmNPF6.6", "ZmNPF2.13", "ZmDof1", "ZmMYB72",
  "ZmWRKY45", "ZmbZIP33", "ZmNLP5", "ZmNIN-like2", "ZmTFL1",
  "ZmALT1", "ZmNRT1.5", "ZmNPF7.3", "ZmAMT3.1", "ZmGS1.5",
  "ZmGOGAT3", "ZmNIA3", "ZmAS3", "ZmAAP3", "ZmNPF1.1",
  "ZmNPF2.4", "ZmNPF5.1", "ZmMYB108", "ZmWRKY21", "ZmDof2",
  "ZmbZIP1", "ZmNLP7", "ZmNIN-like3", "ZmALT2", "ZmGDH3",
  "ZmNRT2.3", "ZmAMT1.5", "ZmGS2.2", "ZmGOGAT4", "ZmAS4",
  "ZmAAP4", "ZmLHT2", "ZmNPF8.1", "ZmDof3", "ZmMYB29",
  "ZmWRKY53", "ZmbZIP53", "ZmNLP3", "ZmNIN-like4", "ZmTFL2",
  "ZmALT3", "ZmNRT1.7", "ZmNPF3.1", "ZmAMT4.1", "ZmGS3.1",
  "ZmGOGAT5", "ZmNIA4", "ZmAS5", "ZmAAP5", "ZmNPF2.12",
  "ZmNPF5.9", "ZmMYB1", "ZmWRKY1", "ZmDof5", "ZmbZIP75",
  "ZmNLP1", "ZmNIN-like1", "ZmTFL3", "ZmALT4", "ZmGDH4",
  "ZmNRT2.5", "ZmAMT1.6", "ZmGS3.2", "ZmGOGAT6", "ZmAS6",
  "ZmAAP6", "ZmLHT3", "ZmNPF1.2", "ZmNPF7.7", "ZmDof7",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function randomFPKM(seed: number): number {
  return Math.round((seededRandom(seed) * 50 + 0.5) * 100) / 100;
}

function randomLog2FC(seed: number): number {
  return Math.round((seededRandom(seed) * 8 - 4) * 100) / 100;
}

function randomPAdj(seed: number): number {
  return Math.pow(10, -(seededRandom(seed) * 5 + 0.3));
}

export const expressionMatrix: ExpressionRecord[] = geneNames.flatMap(
  (geneName, geneIndex) =>
    tissues.flatMap((tissue, tissueIndex) =>
      timepoints.flatMap((timepoint, tpIndex) => {
        const geneId = `Zm${String(geneIndex + 1).padStart(5, "0")}`;
        const base = geneIndex * 1000 + tissueIndex * 100 + tpIndex;
        return [
          {
            geneId,
            geneName,
            tissue,
            condition: "lowN" as const,
            timepoint,
            value: randomFPKM(base * 7 + 1),
            log2FC: randomLog2FC(base * 11 + 2),
            padj: randomPAdj(base * 13 + 3),
          },
          {
            geneId,
            geneName,
            tissue,
            condition: "highN" as const,
            timepoint,
            value: randomFPKM(base * 17 + 4),
            log2FC: randomLog2FC(base * 19 + 5),
            padj: randomPAdj(base * 23 + 6),
          },
        ];
      })
    )
);
