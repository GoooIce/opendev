import { create } from "zustand";
import type {
  CandidateGene,
  NitrogenLevel,
  GrowthStage,
  ProcessId,
  TabId,
} from "../data/types";

interface PlatformState {
  nitrogenLevel: NitrogenLevel;
  growthStage: GrowthStage;
  selectedGene: CandidateGene | null;
  selectedProcess: ProcessId | null;
  activeTab: TabId;
  hoveredProcess: ProcessId | null;
  agentResults: CandidateGene[];
  isAgentRunning: boolean;

  setNitrogenLevel: (level: NitrogenLevel) => void;
  setGrowthStage: (stage: GrowthStage) => void;
  setSelectedGene: (gene: CandidateGene | null) => void;
  setSelectedProcess: (processId: ProcessId | null) => void;
  setActiveTab: (tab: TabId) => void;
  setHoveredProcess: (processId: ProcessId | null) => void;
  setAgentResults: (results: CandidateGene[]) => void;
  setIsAgentRunning: (running: boolean) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  nitrogenLevel: "medium",
  growthStage: "vegetative",
  selectedGene: null,
  selectedProcess: null,
  activeTab: "overview",
  hoveredProcess: null,
  agentResults: [],
  isAgentRunning: false,

  setNitrogenLevel: (level) =>
    set({ nitrogenLevel: level }),
  setGrowthStage: (stage) =>
    set({ growthStage: stage }),
  setSelectedGene: (gene) =>
    set({ selectedGene: gene }),
  setSelectedProcess: (processId) =>
    set({ selectedProcess: processId }),
  setActiveTab: (tab) =>
    set({ activeTab: tab }),
  setHoveredProcess: (processId) =>
    set({ hoveredProcess: processId }),
  setAgentResults: (results) =>
    set({ agentResults: results }),
  setIsAgentRunning: (running) =>
    set({ isAgentRunning: running }),
}));
