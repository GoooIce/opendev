# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Corn Nitrogen Efficiency Gene Mining Platform (玉米氮高效高通量基因挖掘与应用平台) — a full-screen data visualization dashboard for molecular biology researchers, built with Next.js 16 + React 19 + TypeScript. Displays multi-omics data, interactive corn plant biology diagrams, GWAS results, and AI-powered gene screening.

## Commands

```bash
bun run dev       # Start dev server (http://localhost:3000)
bun run build     # Production build (Turbopack)
bun run start     # Serve production build
bun run lint      # ESLint
```

Package manager: **bun**

## Architecture

### Single-Page Dashboard

The app is a single-page full-screen dashboard (`app/page.tsx`) with no routing. All content renders in one viewport using `100vw x 100vh`.

### Layout System

`DashboardLayout` uses a **3-column grid** (left 20vw | center flex | right 20vw). The center column uses **CSS Grid** with row heights (`14vh | 1fr | 20vh`).

### Key Design Decisions

- **Theme**: "翠微生命" — dark blue base `#0A1628`, green primary `#1DB954`, gold accent `#F0A500`. 5 omics colors (genomics blue, transcript purple, protein orange, metabolite cyan, phenome red) in CSS variables.
- **Central Visual**: Corn plant SVG with 6 interactive biology process nodes (D3.js). Nitrogen level slider controls process activity.
- **Charts**: ECharts 6 for Manhattan plot, omics heatmap, phenotype timeline. Cytoscape.js for co-expression network.
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/openai`) for gene screening agent and research assistant. All AI features have mock fallback.
- **State**: Zustand store (`store/platform-store.ts`) manages nitrogenLevel, selectedGene, selectedProcess, activeTab.
- **Data**: All mock data in `data/` directory — 50 candidate genes, 20 germplasm accessions, ~10K GWAS SNPs, expression matrix, CRISPR events, KEGG pathway. No backend.

### Component Organization

- `components/dashboard/` — Layout shell, Header (tabs + process status bar), KPICard (with sparkline + tags)
- `components/organism/` — CornPlantDiagram, ProcessNode, NitrogenSlider, PathwayViewer
- `components/charts/` — ManhattanPlot, CoexpressionNetwork, PhenotypeTimeline
- `components/panels/` — OmicsDataPanel, ConstructPanel, AgentPanel, ValidationPanel, AnalysisLog
- `components/platform/` — AIPanel
- `data/` — Typed mock datasets (genes, germplasm, gwas-results, expression-matrix, phenotypes, pathways, crispr-events, processes)
- `store/` — Zustand global state
- `hooks/` — `useCountUp`, `useScreenAdapter`, `useNitrogenLevel`, `useGeneSelection`

### CSS Conventions

- `data-card` class: standard panel style (dark bg + green border + border-radius)
- `corner-decoration` class: animated corner lines for cards
- `glow-text` class: green text-shadow effect
- `particle-flow` class: SVG dash animation for nitrogen flow
- `node-pulse` class: process node glow animation
- All sizing uses CSS variables or `clamp()` — never hardcoded px for layout

## Next.js 16 Notes

This project uses Next.js 16 with breaking changes. Key: App Router only, Turbopack for builds, React 19 support.

## PRD

Full product spec at `docs/prd-v3.md`. Implementation plan at `docs/plan-gene-platform.md`.
