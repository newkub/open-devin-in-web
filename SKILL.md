---
name: openweb-devin-global-skills
description: α╕¬α╕úα╣ëα╕▓α╕ç web graph α╕éα╕¡α╕ç devin global skills α╣üα╕¬α╕öα╕ç relations α╕₧α╕úα╣ëα╕¡α╕í UX α╕öα╕╡
allowed-tools:
  - read
  - edit
  - grep
  - glob
  - exec
  - write
  - ask_user_question
triggers:
  - user
  - model
related:
  - follow-write-devin-skills
  - check-circular-dependencies
  - use-lib-effective
  - visualize-in-web
  - follow-uxui
  - follow-web-design
  - follow-vite
  - open-web
  - suggest-next-action
---

## Goal

α╕¬α╕úα╣ëα╕▓α╕ç web graph α╕éα╕¡α╕ç devin global skills α╣éα╕öα╕óα╣üα╕¬α╕öα╕çα╕äα╕ºα╕▓α╕íα╕¬α╕▒α╕íα╕₧α╕▒α╕Öα╕ÿα╣îα╕êα╕▓α╕ü `related` α╕úα╕¡α╕çα╕úα╕▒α╕Üα╕üα╕▓α╕úα╕Ñα╕▓α╕ü/α╣Çα╕Ñα╕╖α╕¡α╕ü node α╣Çα╕₧α╕╖α╣êα╕¡α╕ùα╕│ `/follow-write-devin-skills`

## Scope

α╣âα╕èα╣ëα╕¬α╕│α╕½α╕úα╕▒α╕Ü `%APPDATA%/devin/skills/` α╕½α╕úα╕╖α╕¡ project skills directory α╣Çα╕₧α╕╖α╣êα╕¡ visualize α╣éα╕äα╕úα╕çα╕¬α╕úα╣ëα╕▓α╕ç skills α╣Çα╕¢α╣çα╕Öα╕üα╕úα╕▓α╕ƒ α╕₧α╕úα╣ëα╕¡α╕í interaction α╣âα╕Ö browser

## Execute

### 1. Scan Skills
> Goal: α╕úα╕ºα╕Üα╕úα╕ºα╕í metadata α╕éα╕¡α╕çα╕ùα╕╕α╕ü skill

1. `glob` α╕½α╕▓ `*/SKILL.md` α╣âα╕Ö target skills directory
2. `read` α╣üα╕òα╣êα╕Ñα╕░α╣äα╕ƒα╕Ñα╣îα╣üα╕Ñα╕░ parse frontmatter `name`, `description`, `related`
3. α╕¬α╕úα╣ëα╕▓α╕ç nodes α╕êα╕▓α╕ü `name` α╣üα╕Ñα╕░ edges α╕êα╕▓α╕ü `related`
4. α╣Çα╕üα╣çα╕Ü data α╣Çα╕¢α╣çα╕Ö `skills-graph.json` α╣âα╕Ö OS temp directory

### 2. Analyze Relationships
> Goal: α╕úα╕╣α╣ë cycles α╣üα╕Ñα╕░α╕üα╕Ñα╕╕α╣êα╕íα╕éα╕¡α╕ç skills

1. α╕ùα╕│ `/check-circular-dependencies` α╣Çα╕₧α╕╖α╣êα╕¡α╕½α╕▓ cycles α╣âα╕Ö `related`
2. α╕êα╕▒α╕öα╕üα╕Ñα╕╕α╣êα╕í nodes α╕òα╕▓α╕í prefix: `follow-`, `run-`, `check-`, `report-`, `idea-`
3. α╕úα╕░α╕Üα╕╕ isolated nodes α╣Çα╕₧α╕╖α╣êα╕¡α╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Üα╕ºα╣êα╕▓ `related` α╕äα╣ëα╕▓α╕çα╕½α╕úα╕╖α╕¡α╣äα╕íα╣ê

### 3. Choose Graph Tech
> Goal: α╣Çα╕Ñα╕╖α╕¡α╕ü library α╕¬α╕│α╕½α╕úα╕▒α╕Ü graph α╕ùα╕╡α╣Çα╕½α╕íα╕▓α╕░α╕¬α╕í

1. α╕ùα╕│ `/use-lib-effective` α╕¢α╕úα╕░α╣Çα╕íα╕┤α╕Ö graph library α╣Çα╕èα╣êα╕Ö `vis-network`, `d3`, `cytoscape`, `force-graph`
2. α╕ûα╣ëα╕▓α╕òα╣ëα╕¡α╕çα╕üα╕▓α╕ú quick temp HTML ΓåÆ α╕ùα╕│ `/visualize-in-web`
3. α╕ûα╣ëα╕▓α╕òα╣ëα╕¡α╕çα╕üα╕▓α╕ú full Solid + TanStack app ΓåÆ α╕ùα╕│ `/follow-solid-tanstack-orpc-unocss` α╕üα╣êα╕¡α╕Ö
4. α╣Çα╕Ñα╕╖α╕¡α╕ü library α╕ùα╕╡α╕úα╕¡α╕çα╕úα╕▒α╕Ü drag, zoom, pan, α╣üα╕Ñα╕░ tooltip α╣éα╕öα╕óα╣äα╕íα╣êα╣Çα╕éα╕╡α╕óα╕Ö engine α╣Çα╕¡α╕ç

### 4. Design UX
> Goal: α╕¡α╕¡α╕üα╣üα╕Üα╕Ü graph α╣âα╕½α╣ëα╣Çα╕éα╣ëα╕▓α╣âα╕êα╕çα╣êα╕▓α╕ó

1. α╕ùα╕│ `/follow-uxui` α╣Çα╕₧α╕╖α╣êα╕¡α╣Çα╕Ñα╕╖α╕¡α╕ü pattern: dark mode, color coding, search, filter, tooltips
2. α╕üα╕│α╕½α╕Öα╕öα╕¬α╕╡α╕òα╕▓α╕í prefix α╕éα╕¡α╕ç skill
3. α╣âα╕èα╣ë force-directed layout α╕¬α╕│α╕½α╕úα╕▒α╕Üα╕üα╕Ñα╕╕α╣êα╕íα╣âα╕½α╕ìα╣ê
4. α╣Çα╕₧α╕┤α╣êα╕í side panel α╣üα╕¬α╕öα╕ç `description` α╣üα╕Ñα╕░ `related` α╕éα╕¡α╕ç node α╕ùα╕╡α╣Çα╕Ñα╕╖α╕¡α╕ü

### 5. Generate Web in `web/`
> Goal: α╕¬α╕úα╣ëα╕▓α╕ç web project α╕ûα╕▓α╕ºα╕úα╣âα╕Ö `web/` α╕éα╕¡α╕ç workspace

1. α╕¬α╕úα╣ëα╕▓α╕ç `web/` directory α╣âα╕Ö project root
2. α╣âα╕èα╣ë `/follow-web-design` α╕¡α╕¡α╕üα╣üα╕Üα╕Ü UI/UX α╣üα╕Ñα╕░ `/follow-vite` α╕¬α╕úα╣ëα╕▓α╕ç scaffold
3. α╕¬α╕úα╣ëα╕▓α╕ç entry file (`web/index.html` α╕½α╕úα╕╖α╕¡ `web/src/App.tsx`) α╣éα╕½α╕Ñα╕ö `skills-graph.json`
4. α╣âα╕èα╣ë graph library α╣Çα╕èα╣êα╕Ö `vis-network`, `d3`, `cytoscape` α╕½α╕úα╕╖α╕¡ `force-graph` render nodes/edges
5. α╣Çα╕₧α╕┤α╣êα╕í controls: search, filter by prefix, reset zoom, toggle dark mode
6. α╕úα╕▒α╕Öα╕ùα╕öα╕¬α╕¡α╕Üα╕öα╣ëα╕ºα╕ó `bunx serve web/` α╕½α╕úα╕╖α╕¡ `/open-web`

### 6. Add Drag/Select Interaction
> Goal: α╕£α╕╣α╕üα╕üα╕▓α╕úα╕Ñα╕▓α╕ü/α╣Çα╕Ñα╕╖α╕¡α╕ü node α╕üα╕▒α╕Ü action

1. α╕êα╕▒α╕Ü event `onNodeDragEnd` α╕½α╕úα╕╖α╕¡ `onNodeSelect` α╕êα╕▓α╕ü graph library
2. α╣Çα╕íα╕╖α╣êα╕¡ user α╕Ñα╕▓α╕üα╕½α╕úα╕╖α╕¡α╣Çα╕Ñα╕╖α╕¡α╕ü node α╣âα╕½α╣ëα╣üα╕¬α╕öα╕çα╕úα╕▓α╕óα╕Ñα╕░α╣Çα╕¡α╕╡α╕óα╕öα╣âα╕Ö side panel
3. `ask_user_question` α╕ºα╣êα╕▓α╕òα╣ëα╕¡α╕çα╕üα╕▓α╕úα╕ùα╕│ `/follow-write-devin-skills` α╕¬α╕│α╕½α╕úα╕▒α╕Ü skill α╕Öα╕╡α╣ëα╕½α╕úα╕╖α╕¡α╣äα╕íα╣ê
4. α╕ûα╣ëα╕▓ user α╕òα╕¡α╕Ü yes ΓåÆ α╕ùα╕│ `/follow-write-devin-skills` α╣éα╕öα╕óα╕úα╕░α╕Üα╕╕ `name` α╕éα╕¡α╕ç node α╕ùα╕╡α╣Çα╕Ñα╕╖α╕¡α╕ü

### 7. Open And Ship
> Goal: α╣üα╕¬α╕öα╕çα╕£α╕Ñα╣üα╕Ñα╕░ finalize

1. α╕ùα╕│ `/open-web` α╣Çα╕₧α╕╖α╣êα╕¡α╣Çα╕¢α╕┤α╕ö graph α╣âα╕Ö browser
2. α╕úα╕▓α╕óα╕çα╕▓α╕Öα╕êα╕│α╕Öα╕ºα╕Ö nodes, edges, cycles, α╣üα╕Ñα╕░ isolated nodes
3. α╕ûα╣ëα╕▓α╕òα╣ëα╕¡α╕çα╕üα╕▓α╕ú ship project α╕êα╕úα╕┤α╕çα╕½α╕Ñα╕▒α╕çα╣Çα╕¬α╕úα╣çα╕ê ΓåÆ α╕ùα╕│ `/ship`
4. α╕ùα╕│ `/suggest-next-action` α╣Çα╕₧α╕╖α╣êα╕¡α╣üα╕Öα╕░α╕Öα╕│ step α╕ûα╕▒α╕öα╣äα╕¢

## Rules

### 1. Output Location

- α╕¬α╕úα╣ëα╕▓α╕çα╣äα╕ƒα╕Ñα╣îα╕ûα╕▓α╕ºα╕úα╣âα╕Ö `web/` directory α╕éα╕¡α╕ç project
- α╣Çα╕üα╣çα╕Ü `skills-graph.json` α╣âα╕Ö `web/public/` α╕½α╕úα╕╖α╕¡ `web/src/` α╕òα╕▓α╕í scaffold
- α╕ûα╣ëα╕▓ user α╕òα╣ëα╕¡α╕çα╕üα╕▓α╕úα╕èα╕▒α╣êα╕ºα╕äα╕úα╕▓α╕ºα╣Çα╕ùα╣êα╕▓α╕Öα╕▒α╣ëα╕Ö ΓåÆ α╣âα╕èα╣ë `/visualize-in-web` α╣üα╕ùα╕Ö
- α╣äα╕íα╣êα╣Çα╕éα╕╡α╕óα╕Öα╣äα╕ƒα╕Ñα╣î in project source α╣éα╕öα╕óα╣äα╕íα╣êα╣äα╕öα╣ëα╕úα╕▒α╕Üα╕¡α╕Öα╕╕α╕ìα╕▓α╕ò

### 2. Graph UX

- α╣âα╕èα╣ëα╕¬α╕╡α╣üα╕óα╕üα╕òα╕▓α╕í prefix α╕éα╕¡α╕ç skill
- α╣üα╕¬α╕öα╕ç edges α╕ùα╕┤α╕¿α╕ùα╕▓α╕çα╕êα╕▓α╕ü `related` α╕èα╕▒α╕öα╣Çα╕êα╕Ö
- α╕úα╕¡α╕çα╕úα╕▒α╕Ü zoom, pan, search, filter α╕òα╕▓α╕í `/follow-uxui`
- α╣üα╕¬α╕öα╕ç tooltip α╕öα╣ëα╕ºα╕ó `description`
- α╣äα╕íα╣êα╣üα╕¬α╕öα╕ç cluster α╕ïα╣ëα╕¡α╕Öα╕üα╕▒α╕Öα╕êα╕Öα╕¡α╣êα╕▓α╕Öα╣äα╕íα╣êα╣äα╕½α╕º

### 3. Effective Libraries

- α╣âα╕èα╣ë `vis-network`, `d3`, α╕½α╕úα╕╖α╕¡ `cytoscape` α╕¬α╕│α╕½α╕úα╕▒α╕Ü graph rendering
- α╣äα╕íα╣êα╣Çα╕éα╕╡α╕óα╕Ö graph engine α╣Çα╕¡α╕ç
- α╕ûα╣ëα╕▓α╣âα╕èα╣ë SolidStart α╕òα╣ëα╕¡α╕çα╕ùα╕│ `/follow-solid-tanstack-orpc-unocss` α╕üα╣êα╕¡α╕Ö
- α╣éα╕½α╕Ñα╕ö library α╕£α╣êα╕▓α╕Ö CDN α╕¬α╕│α╕½α╕úα╕▒α╕Ü temp HTML α╕½α╕úα╕╖α╕¡α╕òα╕┤α╕öα╕òα╕▒α╣ëα╕çα╕£α╣êα╕▓α╕Ö package manager α╕¬α╕│α╕½α╕úα╕▒α╕Ü project

### 4. Interaction Safety

- α╕ûα╕▓α╕í user α╕üα╣êα╕¡α╕Öα╕úα╕▒α╕Ö `/follow-write-devin-skills`
- α╣äα╕íα╣ê overwrite skill α╣éα╕öα╕óα╣äα╕íα╣êα╣äα╕öα╣ëα╕úα╕▒α╕Üα╕¡α╕Öα╕╕α╕ìα╕▓α╕ò
- α╣äα╕íα╣êα╣üα╕üα╣ëα╣äα╕é `SKILL.md` α╕òα╣ëα╕Öα╕ëα╕Üα╕▒α╕Üα╕êα╕▓α╕üα╕üα╕▓α╕úα╕Ñα╕▓α╕ü node α╣éα╕öα╕óα╕òα╕úα╕ç

## Expected Outcome

- Web graph α╣üα╕¬α╕öα╕ç devin global skills α╕ùα╕▒α╣ëα╕çα╕½α╕íα╕ö
- Relations α╕èα╕▒α╕öα╣Çα╕êα╕Ö α╕₧α╕úα╣ëα╕¡α╕í color coding α╣üα╕Ñα╕░ search/filter
- α╕¬α╕▓α╕íα╕▓α╕úα╕ûα╕Ñα╕▓α╕ü/α╣Çα╕Ñα╕╖α╕¡α╕ü node α╣Çα╕₧α╕╖α╣êα╕¡α╕ùα╕│ `/follow-write-devin-skills`
- α╣äα╕íα╣êα╕íα╕╡ circular dependencies α╕ïα╣êα╕¡α╕Öα╕¡α╕óα╕╣α╣ê
- `web/` directory α╕₧α╕úα╣ëα╕¡α╕í entry file, graph data, α╣üα╕Ñα╕░ build/serve script
