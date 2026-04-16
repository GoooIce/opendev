export interface YearlyGrainData {
  year: number;
  totalYield: number; // 亿斤
  sowArea: number; // 亿亩
  yieldPerMu: number; // 公斤/亩
}

export const grainProductionData: YearlyGrainData[] = [
  { year: 2020, totalYield: 13390, sowArea: 17.52, yieldPerMu: 382 },
  { year: 2021, totalYield: 13657, sowArea: 17.64, yieldPerMu: 387 },
  { year: 2022, totalYield: 13731, sowArea: 17.75, yieldPerMu: 388 },
  { year: 2023, totalYield: 13908, sowArea: 17.85, yieldPerMu: 391 },
  { year: 2024, totalYield: 14130, sowArea: 17.90, yieldPerMu: 395 },
];

export interface CropData {
  name: string;
  area: number; // 千公顷
  yield: number; // 万吨
  yieldPerMu: number; // 公斤/亩
  color: string;
}

export const cropData2024: CropData[] = [
  { name: "稻谷", area: 29007, yield: 20754, yieldPerMu: 477, color: "#2ECC71" },
  { name: "小麦", area: 23587, yield: 14010, yieldPerMu: 396, color: "#F0A500" },
  { name: "玉米", area: 44741, yield: 29492, yieldPerMu: 439, color: "#3498DB" },
  { name: "大豆", area: 11822, yield: 2363, yieldPerMu: 133, color: "#E8A0BF" },
];
