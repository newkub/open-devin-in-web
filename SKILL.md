---
name: visulize-devin-global-skills-in-web
description: สร้าง web graph ของ devin global skills แสดง relations พร้อม UX ดี
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
  - Select
  - UX
  - edges
  - filter
  - serve
---

## Goal

สร้าง web graph ของ devin global skills โดยแสดงความสัมพันธ์จาก `related` รองรับการลาก/เลือก node เพื่อทำ `/follow-write-devin-skills`

## Scope

ใช้สำหรับ `%APPDATA%/devin/skills/` หรือ project skills directory เพื่อ visualize โครงสร้าง skills เป็นกราฟ พร้อม interaction ใน browser

## Execute

### 1. Scan Skills
> Goal: รวบรวม metadata ของทุก skill

1. `glob` หา `*/SKILL.md` ใน target skills directory
2. `read` แต่ละไฟล์และ parse frontmatter `name`, `description`, `related`
3. สร้าง nodes จาก `name` และ edges จาก `related`
4. เก็บ data เป็น `skills-graph.json` ใน OS temp directory

### 2. Analyze Relationships
> Goal: รู้ cycles และกลุ่มของ skills

1. ทำ `/check-circular-dependencies` เพื่อหา cycles ใน `related`
2. จัดกลุ่ม nodes ตาม prefix: `follow-`, `run-`, `check-`, `report-`, `idea-`
3. ระบุ isolated nodes เพื่อตรวจสอบว่า `related` ค้างหรือไม่

### 3. Choose Graph Tech
> Goal: เลือก library สำหรับ graph ทีเหมาะสม

1. ทำ `/use-lib-effective` ประเมิน graph library เช่น `vis-network`, `d3`, `cytoscape`, `force-graph`
2. ถ้าต้องการ quick temp HTML → ทำ `/visualize-in-web`
3. ถ้าต้องการ full Solid + TanStack app → ทำ `/follow-solid-tanstack-orpc-unocss` ก่อน
4. เลือก library ทีรองรับ drag, zoom, pan, และ tooltip โดยไม่เขียน engine เอง

### 4. Design UX
> Goal: ออกแบบ graph ให้เข้าใจง่าย

1. ทำ `/follow-uxui` เพื่อเลือก pattern: dark mode, color coding, search, filter, tooltips
2. กำหนดสีตาม prefix ของ skill
3. ใช้ force-directed layout สำหรับกลุ่มใหญ่
4. เพิ่ม side panel แสดง `description` และ `related` ของ node ทีเลือก

### 5. Generate Web in `web/`
> Goal: สร้าง web project ถาวรใน `web/` ของ workspace

1. สร้าง `web/` directory ใน project root
2. ใช้ `/follow-web-design` ออกแบบ UI/UX และ `/follow-vite` สร้าง scaffold
3. สร้าง entry file (`web/index.html` หรือ `web/src/App.tsx`) โหลด `skills-graph.json`
4. ใช้ graph library เช่น `vis-network`, `d3`, `cytoscape` หรือ `force-graph` render nodes/edges
5. เพิ่ม controls: search, filter by prefix, reset zoom, toggle dark mode
6. รันทดสอบด้วย `bunx serve web/` หรือ `/open-web`

### 6. Add Drag/Select Interaction
> Goal: ผูกการลาก/เลือก node กับ action

1. จับ event `onNodeDragEnd` หรือ `onNodeSelect` จาก graph library
2. เมื่อ user ลากหรือเลือก node ให้แสดงรายละเอียดใน side panel
3. `ask_user_question` ว่าต้องการทำ `/follow-write-devin-skills` สำหรับ skill นี้หรือไม่
4. ถ้า user ตอบ yes → ทำ `/follow-write-devin-skills` โดยระบุ `name` ของ node ทีเลือก

### 7. Open And Ship
> Goal: แสดงผลและ finalize

1. ทำ `/open-web` เพื่อเปิด graph ใน browser
2. รายงานจำนวน nodes, edges, cycles, และ isolated nodes
3. ถ้าต้องการ ship project จริงหลังเสร็จ → ทำ `/ship`
4. ทำ `/suggest-next-action` เพื่อแนะนำ step ถัดไป

## Rules

### 1. Output Location

- สร้างไฟล์ถาวรใน `web/` directory ของ project
- เก็บ `skills-graph.json` ใน `web/public/` หรือ `web/src/` ตาม scaffold
- ถ้า user ต้องการชั่วคราวเท่านั้น → ใช้ `/visualize-in-web` แทน
- ไม่เขียนไฟล์ in project source โดยไม่ได้รับอนุญาต

### 2. Graph UX

- ใช้สีแยกตาม prefix ของ skill
- แสดง edges ทิศทางจาก `related` ชัดเจน
- รองรับ zoom, pan, search, filter ตาม `/follow-uxui`
- แสดง tooltip ด้วย `description`
- ไม่แสดง cluster ซ้อนกันจนอ่านไม่ไหว

### 3. Effective Libraries

- ใช้ `vis-network`, `d3`, หรือ `cytoscape` สำหรับ graph rendering
- ไม่เขียน graph engine เอง
- ถ้าใช้ SolidStart ต้องทำ `/follow-solid-tanstack-orpc-unocss` ก่อน
- โหลด library ผ่าน CDN สำหรับ temp HTML หรือติดตั้งผ่าน package manager สำหรับ project

### 4. Interaction Safety

- ถาม user ก่อนรัน `/follow-write-devin-skills`
- ไม่ overwrite skill โดยไม่ได้รับอนุญาต
- ไม่แก้ไข `SKILL.md` ต้นฉบับจากการลาก node โดยตรง

## Expected Outcome

- Web graph แสดง devin global skills ทั้งหมด
- Relations ชัดเจน พร้อม color coding และ search/filter
- สามารถลาก/เลือก node เพื่อทำ `/follow-write-devin-skills`
- ไม่มี circular dependencies ซ่อนอยู่
- `web/` directory พร้อม entry file, graph data, และ build/serve script
