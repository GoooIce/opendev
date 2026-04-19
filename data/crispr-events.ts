import type { CRISPREvent } from "./types";

const editTypes: CRISPREvent["editType"][] = ["knockout", "knockin", "base_edit"];
const statuses: CRISPREvent["status"][] = [
  "designed", "transforming", "regenerating", "validated", "phenotyping",
];
const phenotypes = [
  "NUE提升12%", "根系生物量增加25%", "穗粒数增加8%",
  "叶绿素含量提高15%", "低氮耐受性增强", "籽粒蛋白质含量提升10%",
  "株高降低10%", "灌浆期延长5天", "氮素再动员效率提高18%",
  "叶片衰老延迟7天",
];
const geneNames = [
  "ZmNRT1.1", "ZmNRT2.1", "ZmAMT1.1", "ZmGS1.3", "ZmGOGAT1",
  "ZmNIA1", "ZmDof1", "ZmMYB72", "ZmNLP5", "ZmLHT1",
  "ZmNPF6.6", "ZmAAP2", "ZmGDH1", "ZmNRT3.1", "ZmAMT2.1",
  "ZmTFL1", "ZmWRKY45", "ZmbZIP33", "ZmNIN-like2", "ZmALT1",
  "ZmNRT1.5", "ZmNPF7.3", "ZmAMT3.1", "ZmGS1.5", "ZmGOGAT3",
  "ZmNIA3", "ZmAS3", "ZmAAP3", "ZmNPF1.1", "ZmNPF2.13",
  "ZmMYB108", "ZmWRKY21", "ZmDof2", "ZmbZIP1", "ZmNLP7",
  "ZmNIN-like3", "ZmALT2", "ZmGDH3", "ZmNRT2.3", "ZmAMT1.5",
  "ZmGS2.2", "ZmGOGAT4", "ZmAS4", "ZmAAP4", "ZmLHT2",
  "ZmNPF8.1", "ZmDof3", "ZmMYB29", "ZmWRKY53", "ZmbZIP53",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateEvents(): CRISPREvent[] {
  return geneNames.slice(0, 50).map((geneName, i) => {
    const statusIndex = Math.min(
      statuses.length - 1,
      Math.floor(i / 10)
    );
    const status = statuses[statusIndex];

    return {
      id: `CR${String(i + 1).padStart(4, "0")}`,
      geneId: `Zm${String(i + 1).padStart(5, "0")}`,
      geneName,
      targetSite: `chr${(i % 10) + 1}:${Math.floor(seededRandom(i * 31 + 7) * 200000000)}:${i % 2 === 0 ? "+" : "-"}`,
      editType: editTypes[i % editTypes.length],
      status,
      phenotype:
        status === "validated" || status === "phenotyping"
          ? phenotypes[i % phenotypes.length]
          : undefined,
      date: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    };
  });
}

export const crisprEvents: CRISPREvent[] = generateEvents();
