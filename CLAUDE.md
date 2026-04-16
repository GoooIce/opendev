# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agricultural Industry Big Data Dashboard (农业产业大数据指挥仓) — a full-screen data visualization dashboard for government decision-makers, built with Next.js 16 + React 19 + TypeScript. Displays real-time agricultural metrics, interactive maps, and AI-powered analysis.

## Commands

```bash
bun run dev       # Start dev server (http://localhost:3000)
bun run build     # Production build (Turbopack)
bun run start     # Serve production build
bun run lint      # ESLint
```

Package manager: **bun** (see `.claude/package-manager.json`)

## Architecture

### Single-Page Dashboard

The app is a single-page full-screen dashboard (`app/page.tsx`) with no routing. All content renders in one viewport using `100vw × 100vh`.

### Layout System

`DashboardLayout` uses a **3-column grid** (left 20vw | center flex | right 20vw). The center column uses **CSS Grid** with explicit row heights (`16vh | 1fr | 22vh`) for reliable map sizing — do NOT switch to flex for the center rows, as MapLibre requires a computed pixel height.

### Key Design Decisions

- **Theme**: "翠谷金穗" (Jade Valley & Golden Harvest) — dark blue base `#0A1628`, green primary `#1DB954`, gold accent `#F0A500`. All colors are CSS variables in `globals.css`.
- **Responsive**: Uses `clamp()` for font sizes, `vw/vh` for layout, CSS Grid for center area. Target ratios: 19:6 (base), 16:9, 21:9, 4:3.
- **Map**: MapLibre GL with CARTO dark-matter vector tiles. Labels switched to Chinese via `setLayoutProperty` on `style.load` using `name:zh` field from OpenMapTiles schema.
- **Charts**: ECharts 6 (direct DOM, not echarts-for-react in most components). Each chart uses `ResizeObserver` for container-aware resizing.
- **AI Assistant**: Currently uses mock responses (`lib/ai-mock.tsx`). Designed to swap in Vercel AI SDK (`ai` + `@ai-sdk/openai` already installed) via `app/api/ai-analysis/route.ts`.
- **Data**: All mock data in `data/` directory, sourced from real agricultural statistics (2020-2024). No backend — static JSON with simulated real-time updates via `setInterval`.

### Component Organization

- `components/dashboard/` — Layout shell, Header, KPICard
- `components/charts/` — ECharts visualizations (CropYield, ECommerce, Weather, Economy)
- `components/map/` — MapLibre GL map with province data overlays
- `components/panels/` — Sidebar panels (PestWarning, Equipment, Irrigation, DataLog)
- `data/` — Typed mock datasets (grain-production, land-resources, smart-agriculture, economy, province-data)
- `hooks/` — `useCountUp` (number animation), `useScreenAdapter` (viewport info)

### CSS Conventions

- `data-card` class: standard panel style (dark bg + green border + border-radius)
- `corner-decoration` class: animated corner lines for cards
- `glow-text` class: green text-shadow effect
- All sizing uses CSS variables or `clamp()` — never hardcoded px for layout

## Next.js 16 Notes

This project uses Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before modifying framework-level code. Key: App Router only, Turbopack for builds, React 19 support.

## PRD

Full product spec at `docs/PRD.md` — includes data priorities (P0/P1/P2), department KPI mappings, screen adaptation strategy, and phased implementation plan.
