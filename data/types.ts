export interface CandidateGene {
  id: string;
  name: string;
  alias: string[];
  family: string;
  chromosome: number;
  position: { start: number; end: number };
  evidence: {
    gwas?: { pValue: number; leadSNP: string; trait: string };
    differentialExpression?: { log2FC: number; padj: number; tissue: string };
    networkHub?: { degree: number; betweenness: number; module: string };
    conservation?: {
      orthoArabidopsis: string;
      orthoRice: string;
      similarity: number;
    };
  };
  annotation: {
    goTerms: string[];
    pathway: string[];
    subcellularLocation: string;
    description: string;
  };
  validationStatus: "not_validated" | "in_progress" | "validated" | "published";
  validationDetails?: {
    crisprEvents: number;
    phenotypeEffect: string;
    publication?: string;
  };
  agentScore?: number;
  agentReasoning?: string;
}

export interface GermplasmAccession {
  id: string;
  name: string;
  origin: string;
  nitrogenUseEfficiency: number;
  yieldLowN: number;
  yieldHighN: number;
  traits: Record<string, number>;
}

export interface GWASResult {
  snp: string;
  chromosome: number;
  position: number;
  pValue: number;
  trait: string;
  nearestGene: string;
  isSignificant: boolean;
}

export interface ExpressionRecord {
  geneId: string;
  geneName: string;
  tissue: string;
  condition: "lowN" | "highN";
  timepoint: string;
  value: number;
  log2FC: number;
  padj: number;
}

export interface PhenotypeRecord {
  lineId: string;
  lineName: string;
  nitrogenLevel: "low" | "medium" | "high";
  timepoint: string;
  traits: {
    plantHeight: number;
    leafArea: number;
    rootLength: number;
    biomass: number;
    chlorophyll: number;
    yield: number;
  };
}

export interface PathwayNode {
  id: string;
  name: string;
  type: "enzyme" | "metabolite" | "gene" | "reaction";
  x: number;
  y: number;
  color?: string;
}

export interface PathwayEdge {
  source: string;
  target: string;
  type: "substrate" | "product" | "catalysis" | "regulation";
}

export interface CRISPREvent {
  id: string;
  geneId: string;
  geneName: string;
  targetSite: string;
  editType: "knockout" | "knockin" | "base_edit";
  status: "designed" | "transforming" | "regenerating" | "validated" | "phenotyping";
  phenotype?: string;
  date: string;
}

export type ProcessId =
  | "uptake"
  | "assimilation"
  | "remobilization"
  | "sensing"
  | "metabolism"
  | "regulation";

export interface BiologyProcess {
  id: ProcessId;
  name: string;
  description: string;
  icon: string;
  color: string;
  position: { x: number; y: number };
  relatedGenes: number;
  activityLevels: Record<"low" | "medium" | "high", number>;
  pathways: string[];
}

export type NitrogenLevel = "low" | "medium" | "high";

export type GrowthStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "grain_filling";

export type TabId =
  | "overview"
  | "omics"
  | "mining"
  | "phenotype"
  | "validation"
  | "ai"
  | "literature";
