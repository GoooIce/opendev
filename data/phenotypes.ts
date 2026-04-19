import type { PhenotypeRecord } from "./types";

const lines = [
  { id: "L001", name: "B73" }, { id: "L002", name: "Mo17" },
  { id: "L003", name: "郑单958" }, { id: "L004", name: "先玉335" },
  { id: "L005", name: "登海605" }, { id: "L006", name: "京科968" },
  { id: "L007", name: "浚单20" }, { id: "L008", name: "农大108" },
  { id: "L009", name: "PH207" }, { id: "L010", name: "W22" },
  { id: "L011", name: "CML228" }, { id: "L012", name: "丹玉86" },
  { id: "L013", name: "四单19" }, { id: "L014", name: "德美亚3号" },
  { id: "L015", name: "先正达408" }, { id: "L016", name: "CML247" },
  { id: "L017", name: "吉单261" }, { id: "L018", name: "隆平206" },
  { id: "L019", name: "B97" }, { id: "L020", name: "齐单818" },
];

const nitrogenLevels: PhenotypeRecord["nitrogenLevel"][] = ["low", "medium", "high"];
const timepoints = ["V3", "V6", "VT", "R1", "R3"];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function scaleForNitrogen(
  base: number,
  level: PhenotypeRecord["nitrogenLevel"],
  seed: number
): number {
  const factor = level === "low" ? 0.6 : level === "medium" ? 0.85 : 1;
  return Math.round(base * factor * (0.9 + seededRandom(seed) * 0.2) * 10) / 10;
}

export const phenotypeRecords: PhenotypeRecord[] = lines.flatMap((line, li) =>
  nitrogenLevels.flatMap((nitrogenLevel, ni) =>
    timepoints.map((timepoint, ti) => {
      const base = li * 300 + ni * 60 + ti;
      return {
        lineId: line.id,
        lineName: line.name,
        nitrogenLevel,
        timepoint,
        traits: {
          plantHeight: scaleForNitrogen(200 + seededRandom(base * 7 + 1) * 60, nitrogenLevel, base * 7 + 2),
          leafArea: scaleForNitrogen(500 + seededRandom(base * 11 + 3) * 200, nitrogenLevel, base * 11 + 4),
          rootLength: scaleForNitrogen(80 + seededRandom(base * 13 + 5) * 40, nitrogenLevel, base * 13 + 6),
          biomass: scaleForNitrogen(150 + seededRandom(base * 17 + 7) * 100, nitrogenLevel, base * 17 + 8),
          chlorophyll: scaleForNitrogen(40 + seededRandom(base * 19 + 9) * 20, nitrogenLevel, base * 19 + 10),
          yield: scaleForNitrogen(8 + seededRandom(base * 23 + 11) * 4, nitrogenLevel, base * 23 + 12),
        },
      };
    })
  )
);
