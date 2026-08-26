---
name: visualize-devin
description: สร้าง web graph ของ devin global skills, subagents, MCP, global rules พร้อม UX ดี
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
---

## Goal

สร้าง web graph ของ devin global skills, subagents, MCP servers, และ global rules โดยแสดงความสัมพันธ์จาก `related` รองรับการลาก/เลือก node เพื่อทำ `/follow-write-devin-skills`

## Scope

ใช้สำหรับ `%APPDATA%/devin/skills/` หรือ project skills directory เพื่อ visualize โครงสร้าง skills, subagents, MCP, global rules เป็นกราฟ พร้อม interaction ใน browser

## Execute

### 1. Scan Skills And Resources

> Goal: รวบรวม metadata ของทุก skill, subagent, MCP server, global rule

1. `glob` หา `*/SKILL.md` ใน target skills directory
2. `read` แต่ละไฟล์และ parse frontmatter `name`, `description`, `related`
3. สแกน subagents จาก `.devin/agents/` หรือ `~/.config/devin/agents/`
4. สแกน MCP servers จาก `.devin/config.json` หรือ MCP config
5. สแกน global rules จาก `~/.codeium/windsurf/memories/global_rules.md`
6. สร้าง nodes จาก `name` และ edges จาก `related`
7. เก็บ data เป็น `skills-graph.json` ใน OS temp directory

### 2. Analyze Relationships

> Goal: รู้ cycles และกลุ่มของ resources

1. ทำ `/check-circular-dependencies` เพื่อหา cycles ใน `related`
2. จัดกลุ่ม nodes ตามประเภท: `skill` (prefix: `follow-`, `run-`, `check-`, `report-`, `idea-`), `subagent`, `mcp`, `rule`
3. ระบุ isolated nodes เพื่อตรวจสอบว่า `related` ค้างหรือไม่

### 3. Choose Graph Tech

> Goal: เลือก library สำหรับ graph ที่เหมาะสม

1. ทำ `/use-lib-effective` ประเมิน graph library เช่น `vis-network`, `d3`, `cytoscape`, `force-graph`
2. ถ้าต้องการ quick temp HTML → ทำ `/visualize-in-web`
3. ถ้าต้องการ full Solid + TanStack app → ทำ `/follow-solid-tanstack` ก่อน
4. เลือก library ที่รองรับ drag, zoom, pan, และ tooltip โดยไม่เขียน engine เอง

### 4. Design UX

> Goal: ออกแบบ graph ให้เข้าใจง่าย

1. ทำ `/review-frontend` เพื่อเลือก pattern: dark mode, color coding, search, filter, tooltips
2. กำหนดสีตามประเภท: skill (prefix), subagent, mcp, rule
3. ใช้ force-directed layout สำหรับกลุ่มใหญ่
4. เพิ่ม side panel แสดง `description` และ `related` ของ node ที่เลือก
5. เพิ่ม tabs/views สำหรับสลับระหว่าง skills, subagents, MCP, rules

### 5. Generate Web in `src/`

> Goal: สร้าง web project ถาวรใน `src/` ของ workspace

1. ใช้ `/review-frontend` ออกแบบ UI/UX และ `/follow-tool-vite` สร้าง scaffold
2. สร้าง entry file (`index.html` และ `src/index.tsx`) โหลด `skills-graph.json`
3. ใช้ graph library render nodes/edges
4. เพิ่ม controls: search, filter by type/prefix, reset zoom, toggle dark mode
5. รันทดสอบด้วย `bunx serve` หรือ `/open-web`

### 6. Add Drag/Select Interaction

> Goal: ผูกการลาก/เลือก node กับ action

1. จับ event `onNodeDragEnd` หรือ `onNodeSelect` จาก graph library
2. เมื่อ user ลากหรือเลือก node ให้แสดงรายละเอียดใน side panel
3. `ask_user_question` ว่าต้องการทำ `/follow-write-devin-skills` สำหรับ skill นี้หรือไม่
4. ถ้า user ตอบ yes → ทำ `/follow-write-devin-skills` โดยระบุ `name` ของ node ที่เลือก

### 7. Open And Ship

> Goal: แสดงผลและ finalize

1. ทำ `/open-web` เพื่อเปิด graph ใน browser
2. รายงานจำนวน nodes, edges, cycles, และ isolated nodes
3. ถ้าต้องการ ship project จริงหลังเสร็จ → ทำ `/ship`
4. ทำ `/suggest-next-action` เพื่อแนะนำ step ถัดไป

## Rules

### 1. Output Location

- สร้างไฟล์ถาวรใน `src/` directory ของ workspace
- เก็บ `skills-graph.json` ใน `src/` หรือ `public/` ตาม scaffold
- ถ้า user ต้องการชั่วคราวเท่านั้น → ใช้ `/visualize-in-web` แทน
- ไม่เขียนไฟล์ in project source โดยไม่ได้รับอนุญาต

### 2. Graph UX

- ใช้สีแยกตามประเภท: skill (prefix), subagent, mcp, rule
- แสดง edges ทิศทางจาก `related` ชัดเจน
- รองรับ zoom, pan, search, filter ตาม `/review-frontend`
- แสดง tooltip ด้วย `description`
- ไม่แสดง cluster ซ้อนกันจนอ่านไม่ไหว

### 3. Effective Libraries

- ใช้ `vis-network`, `d3`, หรือ `cytoscape` สำหรับ graph rendering
- ไม่เขียน graph engine เอง
- ถ้าใช้ SolidStart ต้องทำ `/follow-solid-tanstack` ก่อน
- โหลด library ผ่าน CDN สำหรับ temp HTML หรือติดตั้งผ่าน package manager สำหรับ project

### 4. Interaction Safety

- ถาม user ก่อนรัน `/follow-write-devin-skills`
- ไม่ overwrite skill โดยไม่ได้รับอนุญาต
- ไม่แก้ไข `SKILL.md` ตรงจากการลาก node โดยตรง

## Expected Outcome

- Web graph แสดง devin global skills, subagents, MCP servers, global rules ทั้งหมด
- Relations ชัดเจน พร้อม color coding และ search/filter
- สามารถลาก/เลือก node เพื่อทำ `/follow-write-devin-skills`
- ไม่มี circular dependencies ซ่อนอยู่
- `src/` directory พร้อม entry file, graph data, และ build/serve script