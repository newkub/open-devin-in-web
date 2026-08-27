> ![Status](https://img.shields.io/badge/status-in_development-red)

# visualize-devin-in-web

Interactive web graph visualizing Devin global skills, subagents, MCP servers, and global rules relationships.

![Bun](https://img.shields.io/badge/Bun-latest-fbf0df)
![SolidJS](https://img.shields.io/badge/SolidJS-latest-1c6fbb)
![TanStack Router](https://img.shields.io/badge/TanStack_Router-latest-1976d2)
![oRPC](https://img.shields.io/badge/oRPC-latest-303f9f)
![Elysia](https://img.shields.io/badge/Elysia-latest-0097a7)

```text
┌──────────────────────────────────────────────────────────┐
│  visualize-devin-in-web                                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [skills]   [subagents]   [mcp]   [rules]          │  │
│  │                                                    │  │
│  │       o─── follow-architecture                     │  │
│  │       │                                            │  │
│  │       o─── update-readme      o─── graph-renderer  │  │
│  │       │                       │                    │  │
│  │       o─── validate           o─── orpc-server     │  │
│  │                                    │                │  │
│  │                                    o─── elysia      │  │
│  │                                                    │  │
│  │  Search: [____________]   Theme: [dark]            │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Get Started

1. Install Dependencies — `bun install`
   ```bash
   bun install
   ```
2. Start API Server — `bun run server` (port 3000)
   ```bash
   bun run server
   ```
3. Start Dev Server — `bun run dev` (port 5173)
   ```bash
   bun run dev
   ```
4. Build — `bun run build`
   ```bash
   bun run build
   ```

## Features

| Icon | Feature | Description |
|:---:|---------|-------------|
| ![icon](https://api.iconify.design/mdi:graph-outline.svg?color=%231976d2&width=16) | Skills Graph | Nodes from `SKILL.md` frontmatter, edges from `related` |
| ![icon](https://api.iconify.design/mdi:robot-outline.svg?color=%23388e3c&width=16) | Subagents | Visualize `.devin/agents/` subagent profiles |
| ![icon](https://api.iconify.design/mdi:server-network.svg?color=%23d32f2f&width=16) | MCP Servers | Visualize configured MCP servers |
| ![icon](https://api.iconify.design/mdi:file-document-outline.svg?color=%23f57c00&width=16) | Global Rules | Visualize `global_rules.md` rules and references |
| ![icon](https://api.iconify.design/mdi:palette.svg?color=%237b1fa2&width=16) | Color Coding | By type: skill prefix, subagent, mcp, rule |
| ![icon](https://api.iconify.design/mdi:cursor-move.svg?color=%23c2185b&width=16) | Interactions | Drag, zoom, pan, search, filter, select |
| ![icon](https://api.iconify.design/mdi:panel-right.svg?color=%23303f9f&width=16) | Side Panel | Description, incoming/outgoing relations, top skills, stats |
| ![icon](https://api.iconify.design/mdi:weather-night.svg?color=%230097a7&width=16) | Dark/Light Theme | Toggle with keyboard shortcuts |

## Usage

### Usage via Web

Open `http://localhost:5173`. Use search to filter nodes, click a node to see details in side panel, drag to rearrange, scroll to zoom.

```text
┌──────────────────────────────────────────────────────────┐
│  visualize-devin-in-web                                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [skills]   [subagents]   [mcp]   [rules]          │  │
│  │                                                    │  │
│  │       o─── follow-architecture                     │  │
│  │       │                                            │  │
│  │       o─── update-readme      o─── graph-renderer  │  │
│  │       │                       │                    │  │
│  │       o─── validate           o─── orpc-server     │  │
│  │                                    │                │  │
│  │                                    o─── elysia      │  │
│  │                                                    │  │
│  │  Search: [____________]   Theme: [dark]            │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `esc` | Clear selection |
| `f` | Focus selected node |
| `r` | Fit graph |
| `d` | Toggle dark/light theme |
| `p` | Toggle physics |
| `l` | Toggle labels |

### Usage via API

```bash
curl http://localhost:3000/graph
```

| api | description | options | default |
|-----|-------------|---------|---------|
| `GET /graph` | Get full graph data (nodes + edges) | - | - |
| `GET /skills` | List all skills with frontmatter | - | - |
| `GET /subagents` | List all subagent profiles | - | - |

## License

MIT License — see [LICENSE.md](LICENSE.md)
