import { candidateGenes } from "@/data/genes";
import type { CandidateGene } from "@/data/types";

export interface AgentScreeningRequest {
  targetTrait: string;
  minScore: number;
  nitrogenContext?: string;
  maxResults?: number;
}

export interface AgentScreeningResult {
  genes: Array<{
    id: string;
    name: string;
    family: string;
    score: number;
    reasoning: string;
    evidence: string[];
    suggestedExperiment: string;
  }>;
  summary: string;
  confidence: number;
}

export function buildAgentPrompt(request: AgentScreeningRequest): string {
  const geneList = candidateGenes
    .map((g) => {
      const parts: string[] = [];
      parts.push(`${g.name} (${g.id})`);
      parts.push(`  家族: ${g.family}`);
      parts.push(`  得分: ${g.agentScore ?? 0}`);
      parts.push(`  功能: ${g.annotation.description}`);
      if (g.evidence.gwas) parts.push(`  GWAS: p=${g.evidence.gwas.pValue.toExponential(2)}, trait=${g.evidence.gwas.trait}`);
      if (g.evidence.differentialExpression)
        parts.push(`  差异表达: log2FC=${g.evidence.differentialExpression.log2FC.toFixed(2)}, ${g.evidence.differentialExpression.tissue}`);
      if (g.evidence.networkHub) parts.push(`  网络枢纽: 模块=${g.evidence.networkHub.module}, 度=${g.evidence.networkHub.degree}`);
      if (g.evidence.conservation) parts.push(`  保守性: 拟南芥=${g.evidence.conservation.orthoArabidopsis}, 水稻=${g.evidence.conservation.orthoRice}`);
      return parts.join("\n");
    })
    .join("\n\n");

  return `你是玉米氮高效基因筛选Agent。根据目标性状和筛选条件，从候选基因库中筛选出最有可能的基因，并提供详细分析。

## 目标性状
${request.targetTrait}

## 最低分值阈值
${request.minScore}

## 氮水平上下文
${request.nitrogenContext ?? "未指定"}

## 最大返回数量
${request.maxResults ?? 10}

## 候选基因库
${geneList}

请筛选出符合条件的基因，对每个基因提供：
1. 综合评分（0-100）
2. 筛选理由
3. 关键证据列表
4. 建议的验证实验

同时提供整体分析摘要和置信度评估。以JSON格式返回。`;
}

export function generateMockAgentResult(request: AgentScreeningRequest): AgentScreeningResult {
  const filtered = candidateGenes
    .filter((g) => (g.agentScore ?? 0) >= request.minScore)
    .sort((a, b) => (b.agentScore ?? 0) - (a.agentScore ?? 0))
    .slice(0, request.maxResults ?? 10);

  return {
    genes: filtered.map((g) => ({
      id: g.id,
      name: g.name,
      family: g.family,
      score: g.agentScore ?? 0,
      reasoning: g.agentReasoning ?? "综合多重组学证据筛选",
      evidence: getEvidenceList(g),
      suggestedExperiment: getSuggestedExperiment(g),
    })),
    summary: `筛选到 ${filtered.length} 个候选基因，目标性状: ${request.targetTrait}。排名前3的基因分别为 ${filtered.slice(0, 3).map((g) => g.name).join("、")}，均具有多重组学证据支持。`,
    confidence: filtered.length > 5 ? 0.85 : filtered.length > 2 ? 0.7 : 0.5,
  };
}

function getEvidenceList(gene: CandidateGene): string[] {
  const evidence: string[] = [];
  if (gene.evidence.gwas) evidence.push(`GWAS: p=${gene.evidence.gwas.pValue.toExponential(2)}`);
  if (gene.evidence.differentialExpression) evidence.push(`差异表达: log2FC=${gene.evidence.differentialExpression.log2FC.toFixed(2)}`);
  if (gene.evidence.networkHub) evidence.push(`共表达网络hub: ${gene.evidence.networkHub.module}模块`);
  if (gene.evidence.conservation) evidence.push(`跨物种保守: 拟南芥${gene.evidence.conservation.orthoArabidopsis}`);
  return evidence;
}

function getSuggestedExperiment(gene: CandidateGene): string {
  if (gene.evidence.networkHub) return `在${gene.evidence.networkHub.module}模块中进行共表达干扰实验`;
  if (gene.evidence.differentialExpression && gene.evidence.differentialExpression.log2FC > 1)
    return "CRISPR敲除验证其在低氮响应中的功能";
  if (gene.evidence.gwas) return "开发分子标记并在分离群体中验证关联";
  return "RT-qPCR验证表达模式 + CRISPR敲除";
}
