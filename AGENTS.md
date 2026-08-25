# AGENTS.md - visulize-devin

## Architecture

Web graph visualization of Devin global skills, subagents, MCP servers, and global rules.

- **Frontend**: SolidJS + TanStack Router + UnoCSS
- **Backend**: Elysia + oRPC (serves graph data from skills directory)
- **Graph**: vis-network (CDN-loaded, force-directed layout)
- **Build**: Vite

## Skills

- `visulize-devin: /visulize-devin` — main skill (this repo)

## Workspaces

- ไม่ใช่ monorepo: workspace เดียวคือ root

## Development

```bash
bun install
bun run server   # port 3000 (API)
bun run dev      # port 5173 (Vite)
```

## Environment

- `SKILLS_ROOT`: path to skills directory (default: `%APPDATA%\devin\skills`)

## Safety

- ไม่แก้ไข `SKILL.md` ของ skill อื่นโดยตรง
- อ่าน skills directory แบบ read-only ผ่าน oRPC server
