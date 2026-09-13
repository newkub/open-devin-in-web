---
name: open-devin-in-web
description: สร้าง web graph ของ devin global skills, subagents, MCP, global rules พร้อม UX ดี
argument-hint: "[scope]"
allowed-tools:
  - read
  - edit
  - grep
  - find_file_by_name
  - exec
  - write
  - ask_user_question
triggers:
  - user
  - model
related:
  - visualize-in-web
  - update-devin-global-skills
  - check-repo-hygiene
  - alternative
  - follow-create-web
  - review-frontend
  - ship
  - list-devin
---

## Goal

สร้าง web graph ของ devin global skills, subagents, MCP servers, และ global rules โดยแสดงความสัมพันธ์จาก `related` รองรับการลาก/เลือก node เพื่อทำ `/update-devin-global-skills`

## Scope

ใช้สำหรับ `%APPDATA%/devin/skills/` หรือ project skills directory เพื่อ visualize โครงสร้าง skills, subagents, MCP, global rules เป็นกราฟ พร้อม interaction ใน browser
ถ้าต้องการ visualize repository อื่นๆ ทั่วไป ให้ดู `/visualize-in-web`

## Execute

### 1. Scan Skills And Resources

> Goal: รวบรวม metadata ของทุก skill, subagent, MCP server, global rule

Project นี้มี oRPC server อยู่แล้ว (`server.ts` + `src/orpc/router.ts`) ที่ scan live จาก env vars:

1. `SKILLS_ROOT` — skills directory (default `%APPDATA%\devin\skills`), glob `*/SKILL.md` แล้ว parse frontmatter `name`, `description`, `related`
2. `AGENTS_ROOT` — subagents directory (default `~/.config/devin/agents`), glob `*/AGENT.md`
3. `MCP_CONFIG` — MCP config file (default `<SKILLS_ROOT>/.devin/config.json`, อ่าน key `mcpServers` หรือ `servers`)
4. `GLOBAL_RULES` — global rules file (default `~/.codeium/windsurf/memories/global_rules.md`)
5. สร้าง nodes จาก `name` และ edges จาก `related` แล้ว serve ผ่าน oRPC procedure `skillsGraph` (ไม่เขียนไฟล์ json)

### 2. Analyze Relationships

> Goal: รู้ cycles และกลุ่มของ resources

1. ทำ `/check-repo-hygiene circular-dependencies` เพื่อหา cycles ใน `related`
2. จัดกลุ่ม nodes ตามประเภท: `skill` (prefix: `follow-`, `run-`, `check-`, `report-`, `idea-`), `subagent`, `mcp`, `rule`
3. ระบุ isolated nodes เพื่อตรวจสอบว่า `related` ค้างหรือไม่

### 3. Graph Tech (Fixed)

> Goal: ใช้ stack ที่ติดตั้งอยู่ใน project

1. ใช้ `vis-network` (dependency ใน `package.json`) สำหรับ force-directed graph — รองรับ drag, zoom, pan, tooltip
2. Frontend: SolidJS + `@tanstack/solid-router` + UnoCSS + `vite-plugin-solid`
3. Backend: Elysia + oRPC (`server.ts`) serve `/rpc*` บน port 3000
4. ถ้าต้องการ quick temp HTML แทน → ทำ `/visualize-in-web`
5. ไม่เขียน graph engine เอง

### 4. Design UX

> Goal: ออกแบบ graph ให้เข้าใจง่าย

1. ทำ `/review-frontend` เพื่อเลือก pattern: dark mode, color coding, search, filter, tooltips
2. กำหนดสีตามประเภท: skill (prefix), subagent, mcp, rule
3. ใช้ force-directed layout สำหรับกลุ่มใหญ่
4. เพิ่ม side panel แสดง `description` และ `related` ของ node ที่เลือก
5. เพิ่ม tabs/views สำหรับสลับระหว่าง skills, subagents, MCP, rules

### 5. Run Existing Project

> Goal: รัน web app ที่มีอยู่ใน skill directory นี้

1. cd เข้า skill directory (`open-devin-in-web/`) แล้วรัน `bun install`
2. รัน `bun run server` เพื่อ start Elysia + oRPC server บน `http://localhost:3000` (route `/rpc*`, procedure `skillsGraph`)
3. รัน `bun run dev` เพื่อ start Vite dev server บน `http://localhost:5173` (proxy `/rpc` → 3000 ตาม `vite.config.ts`)
4. สำหรับ production: `bun run build` แล้ว `bun run preview`
5. เปิด `http://localhost:5173` ด้วย `/open web`

### 6. Add Drag/Select Interaction

> Goal: ผูกการลาก/เลือก node กับ action

1. จับ event `onNodeDragEnd` หรือ `onNodeSelect` จาก graph library
2. เมื่อ user ลากหรือเลือก node ให้แสดงรายละเอียดใน side panel
3. `ask_user_question` ว่าต้องการทำ `/update-devin-global-skills` สำหรับ skill นี้หรือไม่
4. ถ้า user ตอบ yes → ทำ `/update-devin-global-skills` โดยระบุ `name` ของ node ที่เลือก

### 7. Open And Ship

> Goal: แสดงผลและ finalize

1. ทำ `/open web` เพื่อเปิด graph ใน browser
2. รายงานจำนวน nodes, edges, cycles, และ isolated nodes
3. ถ้าต้องการดู relations ในรูปตาราง → ทำ `/list-devin global-skills`
4. ถ้าต้องการ verify บน local ก่อน push → ทำ `/ship`
5. ถ้าต้องการ ship project จริงหลังเสร็จ → ทำ `/ship`
6. ทำ `/suggest-next-action` เพื่อแนะนำ step ถัดไป

## Rules

### 1. Output Location

- ใช้ project ใน skill directory นี้เป็นแอปถาวร (`index.html`, `src/`, `server.ts` มีอยู่แล้ว)
- Graph data มาจาก oRPC server แบบ live — ไม่เขียน `skills-graph.json`
- ถ้า user ต้องการชั่วคราวเท่านั้น → ใช้ `/visualize-in-web` แทน
- ไม่เขียนไฟล์ in project source โดยไม่ได้รับอนุญาต

### 2. Graph UX

- ใช้สีแยกตามประเภท: skill (prefix), subagent, mcp, rule
- แสดง edges ทิศทางจาก `related` ชัดเจน
- รองรับ zoom, pan, search, filter ตาม `/review-frontend`
- แสดง tooltip ด้วย `description`
- ไม่แสดง cluster ซ้อนกันจนอ่านไม่ไหว

### 3. Effective Libraries

- ใช้ `vis-network` ที่ติดตั้งใน `package.json` สำหรับ graph rendering
- ไม่เขียน graph engine เอง
- ติดตั้ง dependencies ผ่าน `bun install` เท่านั้น — ไม่โหลด library ผ่าน CDN ใน project นี้

### 4. Interaction Safety

- ถาม user ก่อนรัน `/update-devin-global-skills`
- ไม่ overwrite skill โดยไม่ได้รับอนุญาต
- ไม่แก้ไข `SKILL.md` ตรงจากการลาก node โดยตรง
- ใช้ /alternative ถ้าจำเป็น
- ใช้ /follow-create-web (solid-tanstack-router) ถ้าจำเป็น

## Expected Outcome

- Web graph แสดง devin global skills, subagents, MCP servers, global rules ทั้งหมด
- Relations ชัดเจน พร้อม color coding และ search/filter
- สามารถลาก/เลือก node เพื่อทำ `/update-devin-global-skills`
- ไม่มี circular dependencies ซ่อนอยู่
- App รันด้วย `bun run server` (:3000) + `bun run dev` (:5173)

