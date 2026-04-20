"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Header from "@/components/dashboard/Header";
import KPICard from "@/components/dashboard/KPICard";
import CornPlantDiagram from "@/components/organism/CornPlantDiagram";
import OmicsDataPanel from "@/components/panels/OmicsDataPanel";
import ConstructPanel from "@/components/panels/ConstructPanel";
import { usePlatformStore } from "@/store/platform-store";
import AgentPanel from "@/components/panels/AgentPanel";
import ValidationPanel from "@/components/panels/ValidationPanel";
import AnalysisLog from "@/components/panels/AnalysisLog";
import ManhattanPlot from "@/components/charts/ManhattanPlot";
import CoexpressionNetwork from "@/components/charts/CoexpressionNetwork";
import PhenotypeTimeline from "@/components/charts/PhenotypeTimeline";
import type { TabId } from "@/data/types";

export default function Home() {
  const { activeTab, setActiveTab } = usePlatformStore();

  return (
    <DashboardLayout
      header={<Header activeTab={activeTab} onTabChange={(tab: TabId) => setActiveTab(tab)} />}
      leftPanel={
        <>
          <OmicsDataPanel />
          <ConstructPanel />
        </>
      }
      centerTop={
        <>
          <KPICard
            icon="🧬"
            title="NUE综合指数"
            value={68.4}
            unit="%"
            decimals={1}
            trend={{ value: 5.2, label: "较上季" }}
            delay={0}
            sparkline={[58, 60, 63, 65, 62, 66, 68.4]}
            tags={[{ label: "实时", color: "var(--color-success)" }]}
          />
          <KPICard
            icon="gene"
            title="候选基因库规模"
            value={1247}
            unit="个氮相关基因"
            trend={{ value: 17.5, label: "本季新增" }}
            delay={200}
            sparkline={[800, 920, 980, 1050, 1100, 1180, 1247]}
            tags={[{ label: "基因组", color: "var(--color-genomics)" }]}
          />
          <KPICard
            icon="✓"
            title="已验证功能基因"
            value={38}
            unit="个"
            trend={{ value: 12, label: "本月新增" }}
            delay={400}
            sparkline={[15, 18, 22, 26, 30, 35, 38]}
            tags={[{ label: "已发表", color: "var(--color-protein)" }]}
          />
          <KPICard
            icon="📈"
            title="高通量表型通量"
            value={2400}
            unit="株/日"
            trend={{ value: 15.3, label: "较上月" }}
            delay={600}
            sparkline={[1800, 1950, 2000, 2100, 2200, 2350, 2400]}
            tags={[{ label: "表型组", color: "var(--color-phenome)" }]}
          />
        </>
      }
      centerMid={<CornPlantDiagram />}
      centerBottom={
        <>
          <ManhattanPlot />
          <CoexpressionNetwork />
          <PhenotypeTimeline />
        </>
      }
      rightPanel={
        <>
          <AgentPanel />
          <ValidationPanel />
          <AnalysisLog />
        </>
      }
    />
  );
}
