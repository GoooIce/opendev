"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Header from "@/components/dashboard/Header";
import KPICard from "@/components/dashboard/KPICard";
import CropYieldChart from "@/components/charts/CropYieldChart";
import ECommerceTrend from "@/components/charts/ECommerceTrend";
import WeatherPanel from "@/components/charts/WeatherPanel";
import MapContainer from "@/components/map/MapContainer";
import PestWarning from "@/components/panels/PestWarning";
import EquipmentPanel from "@/components/panels/EquipmentPanel";
import IrrigationPanel from "@/components/panels/IrrigationPanel";
import DataLog from "@/components/panels/DataLog";
import AIChatPanel from "@/lib/ai-mock"; // AI chat panel component (tsx)

export default function Home() {
  const [activeTab, setActiveTab] = useState("主页");

  return (
    <>
      <DashboardLayout
        header={<Header activeTab={activeTab} onTabChange={setActiveTab} />}
        leftPanel={
          <>
            <div className="flex-1">
              <PestWarning />
            </div>
            <div style={{ height: "22vh" }}>
              <CropYieldChart />
            </div>
          </>
        }
        centerTop={
          <>
            <KPICard
              icon="🌾"
              title="粮食总产量"
              value={14130}
              unit="亿斤"
              trend={{ value: 1.6, label: "同比" }}
              delay={0}
            />
            <KPICard
              icon="🌱"
              title="粮食播种面积"
              value={17.9}
              unit="亿亩"
              decimals={1}
              trend={{ value: 0.3, label: "同比" }}
              delay={200}
            />
            <KPICard
              icon="🛡️"
              title="耕地总面积"
              value={19.4}
              unit="亿亩（红线 18 亿亩）"
              decimals={1}
              trend={{ value: 0.9, label: "较 2020" }}
              delay={400}
            />
            <KPICard
              icon="🚜"
              title="综合机械化率"
              value={75.64}
              unit="%"
              decimals={2}
              trend={{ value: 1.35, label: "同比" }}
              delay={600}
            />
          </>
        }
        centerMid={<MapContainer />}
        centerBottom={
          <>
            <div className="flex-1"><ECommerceTrend /></div>
            <div className="flex-1"><WeatherPanel /></div>
            <div className="flex-1">
              <div className="data-card p-[0.4vw] h-full">
                <h3 style={{ fontSize: "clamp(9px, 0.55vw, 12px)", color: "var(--text-secondary)", textAlign: "center" }}>
                  农业经济贡献
                </h3>
                <div className="flex-1" style={{ height: "calc(100% - 20px)" }}>
                  {/* Will be replaced by EconomyRing import if needed */}
                </div>
              </div>
            </div>
          </>
        }
        rightPanel={
          <>
            <div style={{ height: "38%" }}>
              <EquipmentPanel />
            </div>
            <div style={{ height: "30%" }}>
              <IrrigationPanel />
            </div>
            <div style={{ height: "30%" }}>
              <DataLog />
            </div>
          </>
        }
      />
      <AIChatPanel />
    </>
  );
}
