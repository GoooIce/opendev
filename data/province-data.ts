export interface ProvinceData {
  name: string;
  code: string;
  lng: number;
  lat: number;
  grainYield: number; // 万吨
  sowArea: number; // 千公顷
  highStandardFarmland: number; // 万亩
  mechanizationRate: number;
}

export const provinceData: ProvinceData[] = [
  { name: "黑龙江", code: "HLJ", lng: 126.66, lat: 45.74, grainYield: 7800, sowArea: 14700, highStandardFarmland: 8500, mechanizationRate: 98 },
  { name: "河南", code: "HEN", lng: 113.65, lat: 34.76, grainYield: 6800, sowArea: 10800, highStandardFarmland: 7200, mechanizationRate: 87 },
  { name: "山东", code: "SD", lng: 117.0, lat: 36.67, grainYield: 5700, sowArea: 8400, highStandardFarmland: 6500, mechanizationRate: 91 },
  { name: "安徽", code: "AH", lng: 117.28, lat: 31.86, grainYield: 4200, sowArea: 7300, highStandardFarmland: 5200, mechanizationRate: 84 },
  { name: "吉林", code: "JL", lng: 125.35, lat: 43.88, grainYield: 4100, sowArea: 5800, highStandardFarmland: 4200, mechanizationRate: 93 },
  { name: "内蒙古", code: "NM", lng: 111.67, lat: 40.82, grainYield: 3900, sowArea: 6900, highStandardFarmland: 4500, mechanizationRate: 86 },
  { name: "河北", code: "HEB", lng: 114.48, lat: 38.03, grainYield: 3800, sowArea: 6400, highStandardFarmland: 4800, mechanizationRate: 85 },
  { name: "江苏", code: "JS", lng: 118.76, lat: 32.04, grainYield: 3700, sowArea: 5500, highStandardFarmland: 4600, mechanizationRate: 88 },
  { name: "四川", code: "SC", lng: 104.07, lat: 30.67, grainYield: 3600, sowArea: 6500, highStandardFarmland: 4400, mechanizationRate: 72 },
  { name: "湖南", code: "HN", lng: 112.98, lat: 28.19, grainYield: 3100, sowArea: 4700, highStandardFarmland: 3800, mechanizationRate: 78 },
  { name: "湖北", code: "HB", lng: 114.34, lat: 30.55, grainYield: 2800, sowArea: 4600, highStandardFarmland: 3600, mechanizationRate: 80 },
  { name: "江西", code: "JX", lng: 115.89, lat: 28.68, grainYield: 2200, sowArea: 3700, highStandardFarmland: 2900, mechanizationRate: 76 },
  { name: "辽宁", code: "LN", lng: 123.43, lat: 41.80, grainYield: 2500, sowArea: 3500, highStandardFarmland: 3200, mechanizationRate: 90 },
  { name: "新疆", code: "XJ", lng: 87.63, lat: 43.79, grainYield: 1900, sowArea: 2800, highStandardFarmland: 3500, mechanizationRate: 82 },
];
