import type { GWASResult } from "./types";

const traits = ["NUE", "leafN", "grainN", "rootN", "biomassLowN"];
const significantGenes = [
  "ZmNRT1.1", "ZmNRT2.1", "ZmAMT1.1", "ZmGS1.3", "ZmGOGAT1",
  "ZmNIA1", "ZmDof1", "ZmMYB72", "ZmNLP5", "ZmLHT1",
  "ZmNPF6.6", "ZmAAP2", "ZmGDH1", "ZmNRT3.1", "ZmAMT2.1",
  "ZmTFL1", "ZmWRKY45", "ZmbZIP33", "ZmNIN-like2", "ZmALT1",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateSNPs(): GWASResult[] {
  const results: GWASResult[] = [];

  for (let chr = 1; chr <= 10; chr++) {
    const chrBase = chr * 10000;
    const significantCount = Math.floor(seededRandom(chrBase * 7 + 1) * 5) + 10;
    const backgroundCount = Math.floor(seededRandom(chrBase * 11 + 2) * 300) + 700;

    for (let i = 0; i < significantCount; i++) {
      const s = chrBase + i * 100 + 3;
      const pos = Math.floor(seededRandom(s * 13 + 4) * 200000000) + 50000;
      results.push({
        snp: `SNP_chr${chr}_${pos}`,
        chromosome: chr,
        position: pos,
        pValue: Math.pow(10, -(seededRandom(s * 17 + 5) * 5 + 5)),
        trait: traits[Math.floor(seededRandom(s * 19 + 6) * traits.length)],
        nearestGene: significantGenes[Math.floor(seededRandom(s * 23 + 7) * significantGenes.length)],
        isSignificant: true,
      });
    }

    for (let i = 0; i < backgroundCount; i++) {
      const s = chrBase + i * 100 + 50;
      const pos = Math.floor(seededRandom(s * 29 + 8) * 200000000) + 50000;
      results.push({
        snp: `SNP_chr${chr}_${pos}`,
        chromosome: chr,
        position: pos,
        pValue: Math.pow(10, -(seededRandom(s * 31 + 9) * 3 + 0.5)),
        trait: traits[Math.floor(seededRandom(s * 37 + 10) * traits.length)],
        nearestGene: `Zm${chr}G${String(Math.floor(seededRandom(s * 41 + 11) * 50000)).padStart(6, "0")}`,
        isSignificant: false,
      });
    }
  }

  return results.sort((a, b) => a.chromosome - b.chromosome || a.position - b.position);
}

export const gwasResults: GWASResult[] = generateSNPs();
