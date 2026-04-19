import { candidateGenes } from "@/data/genes";
import { gwasResults } from "@/data/gwas-results";
import type { CandidateGene } from "@/data/types";

const GENE_SUMMARY = candidateGenes
  .slice(0, 20)
  .map((g) => `${g.name} (${g.family}, score: ${g.agentScore ?? 0})`)
  .join(", ");

const SIGNIFICANT_SNPS = gwasResults
  .filter((r) => r.isSignificant)
  .slice(0, 10)
  .map((r) => `${r.snp} on Chr${r.chromosome} near ${r.nearestGene} (p=${r.pValue.toExponential(1)})`)
  .join("; ");

export function buildSystemPrompt(context?: {
  selectedGene?: CandidateGene | null;
  nitrogenLevel?: string;
}): string {
  let prompt = `你是玉米氮高效高通量基因挖掘平台的AI科研助手。你的职责是协助分子生物学研究人员进行基因功能分析、数据解读和实验设计。

## 平台数据概览
- 候选基因库: ${candidateGenes.length} 个氮相关基因
- GWAS 关联信号: ${gwasResults.length} 个 SNP（其中 ${gwasResults.filter((r) => r.isSignificant).length} 个显著）
- 表型数据: 20 个玉米品系 × 3 氮水平 × 5 时间点
- CRISPR 编辑事件: 12 个功能验证实验

## 高分基因（Top 20）
${GENE_SUMMARY}

## 显著 GWAS 位点
${SIGNIFICANT_SNPS}

## 你的能力
1. **基因功能解读** — 基于多重证据（GWAS、差异表达、网络枢纽、保守性）分析基因功能
2. **GWAS 结果解读** — 解释曼哈顿图中的显著信号和连锁不平衡区域
3. **实验设计建议** — 为功能验证实验（CRISPR、过表达、RNAi）提供建议
4. **通路分析** — 分析氮代谢通路中基因的上下游关系
5. **数据查询** — 回答关于平台数据的问题

## 回答规范
- 使用中文回答
- 引用具体数据时标注来源（如"GWAS数据显示..."）
- 涉及基因名称时使用斜体格式
- 如不确定，明确说明并提供可能的解释`;

  if (context?.selectedGene) {
    const g = context.selectedGene;
    prompt += `\n\n## 当前选中基因\n名称: ${g.name}\n家族: ${g.family}\n得分: ${g.agentScore ?? 0}\n功能描述: ${g.annotation.description}`;
    if (g.evidence.gwas) {
      prompt += `\nGWAS证据: p=${g.evidence.gwas.pValue.toExponential(2)}, 性状=${g.evidence.gwas.trait}`;
    }
    if (g.evidence.differentialExpression) {
      prompt += `\n差异表达: log2FC=${g.evidence.differentialExpression.log2FC.toFixed(2)}, ${g.evidence.differentialExpression.tissue}`;
    }
  }

  if (context?.nitrogenLevel) {
    prompt += `\n\n## 当前氮水平\n${context.nitrogenLevel === "low" ? "低氮胁迫" : context.nitrogenLevel === "high" ? "高氮条件" : "中氮（正常）"}`;
  }

  return prompt;
}

export const MOCK_RESPONSES = [
  "根据平台数据分析，*ZmNRT2.1* 是目前得分最高的候选基因（score: 95），其GWAS信号在Chr5上达到p=1.2e-9的显著性水平。该基因编码硝酸盐转运蛋白，在低氮条件下表达显著上调（FC=4.2）。建议优先通过CRISPR敲除实验验证其在氮吸收中的功能。",
  "从GWAS曼哈顿图可以看到，Chr5和Chr8上存在两个较强的关联信号簇。Chr5上的主效位点靠近 *ZmNRT2.1*，而Chr8上的信号与 *ZmAMT1.3*（铵转运蛋白）连锁。这两个位点在不同氮水平下均表现稳定，是氮高效育种的潜在分子标记。",
  "关于实验设计建议：对于 *ZmNLP5*（NIN-like蛋白），建议采用以下策略：\n1. **CRISPR敲除** — 验证其在氮信号传导中的必要性\n2. **过表达** — 在B73背景中过表达，评估低氮耐受性改善\n3. **下游靶基因鉴定** — 通过ChIP-seq确定其调控的氮响应基因网络\n\n平台CRISPR模块已有3个相关编辑事件记录。",
  "当前低氮胁迫条件下，差异表达分析显示以下基因显著上调：\n- *ZmNRT2.1*（硝酸盐转运，FC=4.2）\n- *ZmNRT2.5*（硝酸盐转运，FC=3.1）\n- *ZmAMT1.3*（铵转运，FC=2.8）\n- *ZmNLP5*（转录因子，FC=3.5）\n\n这些基因构成低氮响应的核心调控网络，其中 *ZmNLP5* 可能是关键转录调控枢纽。",
  "根据共表达网络分析，turquoise模块（绿色）包含15个hub基因，主要富集在氮代谢和氨基酸合成通路。其中 *ZmGS1.4*（谷氨酰胺合成酶）是代谢通路的关键节点，连接氮吸收和氨基酸合成两个过程。该模块在低氮条件下表现高度协同表达。",
];

let mockIndex = 0;

export function getNextMockResponse(): string {
  const response = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
  mockIndex++;
  return response;
}
