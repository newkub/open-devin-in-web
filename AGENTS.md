---
name: open-devin-in-web
description: Web graph visualization ของ Devin global skills, subagents, MCP servers
related:
  - follow-lib-solidjs
  - follow-tool-vite
  - follow-lib-unocss
  - deep-review
  - deep-validate
  - git-commit
  - ship-to-dev-branch
  - watch-deploy
---

## Goal

Web graph visualization ของ Devin global skills, subagents, MCP servers และ global rules

## Scope

ใช้กับ `open-devin-in-web` package ที่เป็น web app สำหรับ visualize skills directory แบบ read-only

## Execute

### 1. Start Every Task

> Goal: ตรวจสอบ workspace ก่อนลงมือ

1. ทำตาม `/follow-agents-md` เพื่ออ่าน `AGENTS.md`
2. ทำตาม `/deep-review`
3. อ่าน global rules จาก `C:\Users\Veerapong\.codeium\windsurf\memories\global_rules.md`

### 2. Develop

> Goal: พัฒนาและ maintain visualization

1. ทำตาม `/follow-lib-solidjs`
2. ใช้ `/follow-tool-vite` สำหรับ build
3. ใช้ `/follow-lib-unocss` สำหรับ styling
4. รัน `bun run build` หลังแก้ไข

### 3. Validate And Ship

> Goal: ตรวจสอบและ commit

1. ทำตาม `/deep-validate`
2. ทำตาม `/git-commit`
3. ทำตาม `/ship-to-dev-branch`

## Rules

### 1. Format

- ใช้ frontmatter `name`, `description`, `related`
- ไฟล์ไม่เกิน 250 บรรทัด

### 2. Architecture

- Frontend: SolidJS + TanStack Router + UnoCSS
- Backend: Elysia + oRPC (serves graph data from skills directory)
- Graph: vis-network (npm bundle, mini graph in right panel)
- Markdown preview: markdown-exit (`html: false`) + shiki (`@shikijs/markdown-exit`, async render, dual light/dark themes, twoslash for `ts twoslash` blocks)
- Build: Vite
- `src/App.tsx` — Main app component
- `src/graph.ts` — Shared node types and color maps
- `src/markdown.ts` — markdown-exit instance, frontmatter parser, heading extraction
- `src/components/` — TopBar (centered search + options dropdown), Sidebar (type tabs + prefix dropdown + node list), Content (markdown/MCP card), FlowPanel (flow + outline tabs), MiniGraph
- `src/orpc/` — oRPC client and router (`skillsGraph`, `nodeSource`)
- `src/routes/` — File-system routes
- `src/styles/` — CSS stylesheets (base, layout, flow, preview)
- `server.ts` — Elysia server entry point

### 3. Tech Stack

- `SolidJS: /follow-lib-solidjs`
- `Vite: /follow-tool-vite`
- `UnoCSS: /follow-lib-unocss`
- `Elysia: /learn (web)`
- `oRPC: /learn (web)`
- `vis-network: /learn (web)`

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


