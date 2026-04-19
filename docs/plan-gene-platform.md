# 实施计划：玉米氮高效高通量基因挖掘与应用平台

> 基于 PRD v3 的完整重写计划 | 7 个阶段

---

## 概述

将现有"农业产业大数据指挥仓"仪表盘**完全重写**为"玉米氮高效高通量基因挖掘与应用平台"。

### 核心变更

| 维度 | 当前 | 目标 |
|------|------|------|
| 中央视觉 | MapLibre 地图 | 玉米植株六维生物学过程交互图 (D3.js SVG) |
| 数据域 | 农业统计 | 基因/组学数据 (1,247 候选基因, GWAS, 表达矩阵) |
| 可视化 | 基础图表 | 曼哈顿图、共表达网络、组学热图、通路查看器、粒子系统 |
| AI 能力 | Mock 聊天 | Agent 基因筛选系统 + AI 科研助手 (Vercel AI SDK) |
| 新依赖 | - | d3, cytoscape, cytoscape-cose-bilkent |
| 移除依赖 | maplibre-gl, react-map-gl, deck.gl 全家桶 | - |

### 可复用资产

- 3列网格布局系统 (DashboardLayout)
- CSS 变量/主题（相同配色"翠微生命"，增加 5 种组学颜色）
- KPICard 模式（增强 sparkline + tags）
- Header 模式（新标签页 + 流程状态条）
- DataLog → AnalysisLog（重构）
- useCountUp / useScreenAdapter hooks（原样保留）
- 包基础设施：Next.js 16, Tailwind 4, ECharts 6, Zustand, Vercel AI SDK

---

## 文件变更清单

### 删除（14 个旧域文件）

```
components/map/MapContainer.tsx
components/charts/CropYieldChart.tsx
components/charts/ECommerceTrend.tsx
components/charts/WeatherPanel.tsx
components/charts/EconomyRing.tsx
components/panels/PestWarning.tsx
components/panels/EquipmentPanel.tsx
components/panels/IrrigationPanel.tsx
data/grain-production.ts
data/province-data.ts
data/smart-agriculture.ts
data/economy.ts
data/land-resources.ts
lib/ai-mock.tsx
```

### 修改（6 个文件）

| 文件 | 变更内容 |
|------|----------|
| `package.json` | 移除地图包，添加 d3 + cytoscape |
| `app/globals.css` | 添加 5 种组学颜色变量、新动画关键帧 |
| `app/layout.tsx` | 更新 metadata 标题/描述 |
| `app/page.tsx` | 完全重写，新组件接线 |
| `components/dashboard/Header.tsx` | 新标题、新标签页、流程状态条 |
| `components/dashboard/KPICard.tsx` | 添加 sparkline + tags props |
| `components/dashboard/DashboardLayout.tsx` | 微调行高比例 |
| `CLAUDE.md` | 更新项目文档 |

### 新增（30+ 个文件）

**数据层 (8)**
- `data/types.ts` — 全局类型定义
- `data/genes.ts` — 候选基因数据 (~50 条模拟)
- `data/germplasm.ts` — 种质资源
- `data/gwas-results.ts` — GWAS SNP 关联
- `data/expression-matrix.ts` — 表达矩阵
- `data/phenotypes.ts` — 表型时序
- `data/pathways.ts` — KEGG 通路定义
- `data/crispr-events.ts` — CRISPR 编辑事件
- `data/processes.ts` — 6 大生物学过程定义

**状态管理 (1)**
- `store/platform-store.ts` — Zustand 全局状态

**玉米植株图 (4)**
- `components/organism/CornPlantDiagram.tsx` — 核心交互图
- `components/organism/ProcessNode.tsx` — 过程节点
- `components/organism/NitrogenSlider.tsx` — 氮水平控制器
- `components/organism/PathwayViewer.tsx` — 通路详细查看

**面板 (5)**
- `components/panels/OmicsDataPanel.tsx` — 左侧：组学数据总览
- `components/panels/ConstructPanel.tsx` — 左侧：CRISPR 看板
- `components/panels/AgentPanel.tsx` — 右侧：AI 基因筛选
- `components/panels/ValidationPanel.tsx` — 右侧：功能验证
- `components/panels/AnalysisLog.tsx` — 右侧：实时日志

**图表 (3)**
- `components/charts/ManhattanPlot.tsx` — GWAS 曼哈顿图
- `components/charts/CoexpressionNetwork.tsx` — 共表达网络
- `components/charts/PhenotypeTimeline.tsx` — 表型时序

**AI (5)**
- `components/platform/AIPanel.tsx` — AI 科研助手面板
- `lib/ai/agent-prompt.ts` — Agent 筛选 Prompt
- `lib/ai/chat-prompt.ts` — 聊天 Prompt
- `app/api/ai-agent/route.ts` — Agent API
- `app/api/ai-chat/route.ts` — 聊天 API

**可视化工具 (2)**
- `lib/visualization/particle-system.ts` — 粒子系统
- `lib/visualization/organism-svg.ts` — SVG 工具

**Hooks (2)**
- `hooks/useNitrogenLevel.ts`
- `hooks/useGeneSelection.ts`

---

## 阶段实施计划

### Phase 1：基础框架与核心外壳（骨架）

> 目标：可运行的仪表盘，新布局 + 新标题 + 新 KPI + 占位符面板

| 步骤 | 内容 | 风险 |
|------|------|------|
| 1.1 | 更新依赖：`bun remove` 地图包，`bun add d3 cytoscape` | 低 |
| 1.2 | 更新 globals.css：添加 5 种组学颜色、新动画 | 低 |
| 1.3 | 创建 Zustand store (platform-store.ts) | 低 |
| 1.4 | 创建类型定义 (data/types.ts) | 低 |
| 1.5 | 创建全部模拟数据文件 (8 个 data/ 文件) | 中 |
| 1.6 | 重写 Header：新标题 + 新标签 + 流程状态条 | 低 |
| 1.7 | 微调 DashboardLayout 行高比例 | 低 |
| 1.8 | 增强 KPICard：sparkline + tags props | 低 |
| 1.9 | 重写 page.tsx：新组件接线 + 占位符 | 低 |
| 1.10 | 更新 layout.tsx metadata | 低 |
| 1.11 | 更新 CLAUDE.md | 低 |
| 1.12 | 删除 14 个旧文件 | 低 |

**Phase 1 验证：** `bun run build` 通过，`bun run dev` 渲染完整 3 列布局，新 KPI 显示，占位符面板就位

---

### Phase 2：中央玉米植株交互图（核心亮点）

> 目标：可交互的玉米植株 SVG + 6 个过程节点 + 氮水平控制

| 步骤 | 内容 | 风险 |
|------|------|------|
| 2.1 | CornPlantDiagram：手写 SVG 玉米植株（根-茎-叶-穗） | **高** |
| 2.2 | ProcessNode：6 个过程节点定位 + 悬停/点击交互 | 中 |
| 2.3 | 过程间连线：贝塞尔曲线 + 悬停高亮 | 中 |
| 2.4 | NitrogenSlider：3 档氮水平 + 生育期选择 | 低 |
| 2.5 | 氮水平联动：各过程活性实时更新 | 低 |
| 2.6 | PathwayViewer 弹出层（基因列表 + 通路占位） | 低 |

**Phase 2 验证：** 植株图渲染，6 节点可悬停/点击，氮滑块联动，PathwayViewer 弹出

---

### Phase 3：左侧面板（组学数据 + CRISPR 看板）

| 步骤 | 内容 | 风险 |
|------|------|------|
| 3.1 | OmicsDataPanel：ECharts 热图 + 统计卡片 | 中 |
| 3.2 | ConstructPanel：CRISPR 看板泳道 | 中 |
| 3.3 | 接线到 page.tsx | 低 |

---

### Phase 4：右侧面板（Agent + 验证 + 日志）

| 步骤 | 内容 | 风险 |
|------|------|------|
| 4.1 | AgentPanel：筛选配置 + 排名列表（前端排序） | 中 |
| 4.2 | ValidationPanel：证据链 + 小型网络图 | 中 |
| 4.3 | AnalysisLog：从 DataLog 重构，新任务类型 | 低 |
| 4.4 | 接线到 page.tsx | 低 |

---

### Phase 5：底部图表（曼哈顿 + 网络 + 表型时序）

| 步骤 | 内容 | 风险 |
|------|------|------|
| 5.1 | ManhattanPlot：ECharts 散点，~10K SNP 点 | **高** |
| 5.2 | CoexpressionNetwork：Cytoscape.js 力导向 | **高** |
| 5.3 | PhenotypeTimeline：ECharts 多折线 | 低 |
| 5.4 | 接线到 page.tsx | 低 |

---

### Phase 6：AI 科研助手

| 步骤 | 内容 | 风险 |
|------|------|------|
| 6.1 | AI Chat API route (Vercel AI SDK) | 中 |
| 6.2 | Agent API route (结构化输出) | 中 |
| 6.3 | Prompt 模板文件 | 低 |
| 6.4 | AIPanel 聊天界面（替换 ai-mock） | 中 |
| 6.5 | AgentPanel 接入 API | 低 |

**重要：** 所有 AI 功能都有前端 mock 回退，无需 API key 即可运行

---

### Phase 7：打磨与优化

| 步骤 | 内容 | 风险 |
|------|------|------|
| 7.1 | Canvas 粒子系统（硝酸盐/氨基酸流动动画） | 中 |
| 7.2 | 入场动画编排（KPI → 植株 → 侧栏 → 图表） | 低 |
| 7.3 | 4:3/平板响应式适配 | 中 |
| 7.4 | 性能优化（懒加载、防抖、bundle 检查） | 低 |
| 7.5 | KPI sparkline 完整实现 | 低 |
| 7.6 | PathwayViewer D3.js 完整实现 | 高 |

---

## 风险矩阵

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 玉米植株 SVG 质量 | **高** | 先用简化几何路径，SVG 无需植物学精确 |
| ManhattanPlot 性能 | 中 | ECharts `large: true`，背景 SNP 降采样至 5K |
| Cytoscape.js 学习曲线 | 中 | 先用 ECharts graph 原型，必要时才切 Cytoscape |
| Cytoscape.js bundle 大小 | 中 | 动态导入 `lazy(() => import('cytoscape'))` |
| LLM API key 不可用 | 中 | 所有 AI 功能有前端回退，mock 数据可用 |
| 窄面板中图表显示 | 中 | ECharts responsive 配置 + ResizeObserver |
| D3.js + React 集成 | 低 | useRef + useEffect 模式，D3 拥有 SVG 元素 |

---

## 成功标准

- [ ] `bun run build` 无错误通过
- [ ] `bun run dev` 渲染完整 3 列布局
- [ ] 新标题"玉米氮高效高通量基因挖掘与应用平台"
- [ ] 4 个基因/组学 KPI 带计数动画
- [ ] 玉米植株 SVG + 6 个可交互过程节点
- [ ] 氮水平滑块联动所有过程活性
- [ ] 左侧：组学热图 + CRISPR 看板
- [ ] 右侧：Agent 筛选 + 验证面板 + 日志
- [ ] 底部：曼哈顿图 + 网络图 + 表型时序
- [ ] AI 聊天面板可用（至少 mock 模式）
- [ ] 1920x1080 和 3840x1080 下正确渲染
- [ ] 所有 UI 文本中文
- [ ] 无控制台错误
