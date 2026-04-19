"use client";

import { type ReactNode } from "react";

interface DashboardLayoutProps {
  header: ReactNode;
  leftPanel: ReactNode;
  centerTop: ReactNode;
  centerMid: ReactNode;
  centerBottom: ReactNode;
  rightPanel: ReactNode;
}

export default function DashboardLayout({
  header,
  leftPanel,
  centerTop,
  centerMid,
  centerBottom,
  rightPanel,
}: DashboardLayoutProps) {
  return (
    <div className="w-screen h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {header}

      <main className="flex-1 flex gap-[0.5vh] px-[1vw] pb-[0.5vh] min-h-0">
        {/* Left panel */}
        <aside
          className="flex flex-col gap-[0.5vh]"
          style={{ width: "20vw", minWidth: "200px" }}
        >
          {leftPanel}
        </aside>

        {/* Center area */}
        <section
          className="flex-1 min-w-0"
          style={{
            display: "grid",
            gridTemplateRows: "14vh 1fr 20vh",
            gap: "0.5vh",
          }}
        >
          {/* Center top: KPI cards */}
          <div className="flex gap-[0.5vw]">
            {centerTop}
          </div>

          {/* Center mid: Corn plant diagram */}
          <div style={{ minHeight: 0, overflow: "hidden" }}>
            {centerMid}
          </div>

          {/* Center bottom: Charts */}
          <div className="flex gap-[0.5vw]">
            {centerBottom}
          </div>
        </section>

        {/* Right panel */}
        <aside
          className="flex flex-col gap-[0.5vh]"
          style={{ width: "20vw", minWidth: "200px" }}
        >
          {rightPanel}
        </aside>
      </main>
    </div>
  );
}
