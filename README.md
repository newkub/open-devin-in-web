# visualize-devin

Interactive web graph visualizing Devin global skills, subagents, MCP servers, and global rules relationships.

## Features

- **Skills graph**: nodes from `SKILL.md` frontmatter, edges from `related`
- **Subagents**: visualize `.devin/agents/` subagent profiles
- **MCP servers**: visualize configured MCP servers
- **Global rules**: visualize `global_rules.md` rules and their references
- **Color coding**: by type (skill prefix, subagent, mcp, rule)
- **Interactions**: drag, zoom, pan, search, filter, select
- **Side panel**: description, incoming/outgoing relations, top skills, stats
- **Dark/light theme** with keyboard shortcuts

## Tech Stack

- SolidJS + TanStack Router
- oRPC + Elysia server
- vis-network for graph rendering
- UnoCSS for styling
- Vite for build tooling

## Development

```bash
# Install dependencies
bun install

# Start API server (port 3000)
bun run server

# Start dev server (port 5173) in another terminal
bun run dev
```

## Build

```bash
bun run build
```

## Project Structure

```
visualize-devin/
├── src/
│   ├── App.tsx              # Root component
│   ├── Graph.tsx            # vis-network graph component
│   ├── RouterProvider.tsx   # TanStack Router setup
│   ├── index.tsx            # Entry point
│   ├── styles.css           # UnoCSS + custom styles
│   ├── orpc/
│   │   ├── client.ts        # oRPC client
│   │   └── router.ts        # oRPC server router (graph builder)
│   └── routes/
│       └── index.tsx        # Main graph page
├── index.html               # HTML entry
├── package.json
├── tsconfig.json
├── uno.config.ts
├── vite.config.ts
└── server.ts                # Elysia + oRPC server
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `esc` | Clear selection |
| `f` | Focus selected node |
| `r` | Fit graph |
| `d` | Toggle dark/light theme |
| `p` | Toggle physics |
| `l` | Toggle labels |
