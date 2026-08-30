---
name: visualize-devin-in-web
description: Web graph visualization ของ Devin global skills, subagents, MCP servers
related:
  - follow-framework-solidjs
  - follow-tool-vite
  - follow-lib-unocss
  - follow-architecture
  - deep-validate
  - git-commit
  - ship
  - watch-deploy
---

## Goal

Web graph visualization ของ Devin global skills, subagents, MCP servers และ global rules

## Scope

ใช้กับ `visualize-devin-in-web` package ที่เป็น web app สำหรับ visualize skills directory แบบ read-only

## Execute

### 1. Start Every Task

> Goal: ตรวจสอบ workspace ก่อนลงมือ

1. ทำตาม `/follow-agents-md` เพื่ออ่าน `AGENTS.md`
2. ทำตาม `/follow-architecture`
3. อ่าน global rules จาก `C:\Users\Veerapong\.codeium\windsurf\memories\global_rules.md`

### 2. Develop

> Goal: พัฒนาและ maintain visualization

1. ทำตาม `/follow-framework-solidjs`
2. ใช้ `/follow-tool-vite` สำหรับ build
3. ใช้ `/follow-lib-unocss` สำหรับ styling
4. รัน `bun run build` หลังแก้ไข

### 3. Validate And Ship

> Goal: ตรวจสอบและ commit

1. ทำตาม `/deep-validate`
2. ทำตาม `/git-commit`
3. ทำตาม `/ship`

## Rules

### 1. Format

- ใช้ frontmatter `name`, `description`, `related`
- ไฟล์ไม่เกิน 250 บรรทัด

### 2. Architecture

- Frontend: SolidJS + TanStack Router + UnoCSS
- Backend: Elysia + oRPC (serves graph data from skills directory)
- Graph: vis-network (CDN-loaded, force-directed layout)
- Build: Vite
- `src/App.tsx` — Main app component
- `src/Graph.tsx` — Graph visualization
- `src/components/` — UI panels (Detail, Legend, Shortcuts, Stats, TopSkills)
- `src/orpc/` — oRPC client and router
- `src/routes/` — File-system routes
- `src/styles/` — CSS stylesheets
- `server.ts` — Elysia server entry point

### 3. Tech Stack

- `SolidJS: /follow-framework-solidjs`
- `Vite: /follow-tool-vite`
- `UnoCSS: /follow-lib-unocss`
- `Elysia: /learn-from-web`
- `oRPC: /learn-from-web`
- `vis-network: /learn-from-web`

### 4. Scripts

- `bun run dev` — Vite dev server (port 5173)
- `bun run build` — Vite build
- `bun run preview` — Vite preview
- `bun run server` — Elysia server (port 3000)

### 5. Environment

- `SKILLS_ROOT`: path to skills directory (default: `%APPDATA%\devin\skills`)

### 6. Workspaces

- ไม่ใช่ monorepo: single package

### 7. Safety

- ไม่แก้ไข `SKILL.md` ของ skill อื่นโดยตรง
- อ่าน skills directory แบบ read-only ผ่าน oRPC server

## Expected Outcome

- `AGENTS.md` ถูกต้องตาม architecture
- tech stack mapping ครบ
- ผ่าน `/deep-validate`
