# 🧠 Synapse

> **Stop repeating yourself. Give your Cursor, Claude Code, Windsurf, and CLI agents a shared brain.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/Terry20161226/synapse/actions/workflows/ci.yml/badge.svg)](https://github.com/Terry20161226/synapse/actions)
[![npm version](https://img.shields.io/npm/v/synapse-agent.svg)](https://www.npmjs.com/package/synapse-agent)
[![MCP Protocol](https://img.shields.io/badge/Protocol-MCP-orange.svg)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Zero Config](https://img.shields.io/badge/Config-Zero-brightgreen.svg)]()

---

## ⚡ The Problem

Today, developers work across multiple AI tools:
- You prompt **Claude Code** in the terminal to refactor your backend database to PostgreSQL.
- You switch to **Cursor** to write frontend UI components.
- **Result:** Cursor has zero idea that the backend was just rewritten. It generates outdated API calls using deprecated schemas.
- You spend half your day copying and pasting terminal logs and diffs between different AI windows.

**Every AI agent is an amnesiac working in a vacuum.**

---

## 💡 The Solution: Synapse

`Synapse` is a zero-config, local **Shared Context & Memory Engine** for your coding agents. Built natively on Anthropic's **Model Context Protocol (MCP)**, it acts as a lightweight neurological bridge across all your AI tools.

```text
       [ Claude Code ]          [ Cursor / Windsurf ]         [ Aider / CLI ]
              │                           │                          │
              └───────────────┬───────────┴──────────────────────────┘
                              │
               【 Native MCP Protocol (stdio) 】
                              │
                              ▼
    ┌────────────────────────────────────────────────────────┐
    │                      SYNAPSE CORE                      │
    │                                                        │
    │   [1. Shared Blackboard]        [2. Real-time Timeline] │
    │    Active goals & conventions    Who changed what & when │
    │                                                        │
    │   [3. Git / Watcher Sentinel]   [4. Human-Readable Md]  │
    │    Auto-detects file commits     .synapse/context.md     │
    └────────────────────────────────────────────────────────┘
```

When Agent A makes a breakthrough, Agent B knows it instantly.

---

## ⚡ Instant Setup (One Command)

Inside any project root, run:

```bash
npx synapse-agent init
```

This single command automatically:
- 🔌 Injects Synapse into `.cursor/mcp.json`
- 📜 Injects context-awareness guidelines into `.cursorrules`
- 🖥️ Connects to Claude Desktop configuration (if installed)
- 📁 Initializes your local `.synapse/` shared brain

---

## 🚀 Manual Quickstart (60 Seconds)

### 1. Add to Cursor
Add Synapse to your `.cursor/mcp.json` (or Global Cursor Settings):

```json
{
  "mcpServers": {
    "synapse": {
      "command": "npx",
      "args": ["-y", "synapse-agent"]
    }
  }
}
```

### 2. Add to Claude Code / Claude Desktop
Add Synapse to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "synapse": {
      "command": "npx",
      "args": ["-y", "synapse-agent"]
    }
  }
}
```

Or invoke directly in Claude Code:
```bash
claude mcp add synapse npx -y synapse-agent
```

---

## 🛠️ CLI Quick Commands

You can also inspect or update the shared brain directly from your terminal:

```bash
# Launch the live cyberpunk terminal monitor dashboard
npx synapse watch

# Check the shared project context and recent agent decisions
npx synapse status

# Set the active project goal for all agents
npx synapse set-goal "Migrating payment gateway from Stripe to LemonSqueezy"

# Log an architectural decision manually
npx synapse log "Decided to use Drizzle ORM over Prisma for serverless latency"
```

---

## 📦 What's Inside `.synapse/`?

Synapse stores everything **locally in your repository root** in a `.synapse/` folder:
- **`context.md`**: An auto-generated, human-readable Markdown file. Any LLM (or developer) can read it at a glance.
- **`blackboard.json`**: Current active goal, architectural decisions, and registered project rules.
- **`timeline.json`**: Chronological event log of commits, decisions, and milestones.

*(Tip: You can commit `.synapse/` to git so your team members' AI agents share the same context!)*

---

## 🗺️ Roadmap

- [x] **v0.1**: MCP Server + Shared Blackboard + Git Watcher + CLI
- [ ] **v0.2**: Native macOS Menu Bar status widget (Tauri)
- [ ] **v0.3**: Semantic Search / Embeddings over past agent sessions
- [ ] **v0.4**: Team Sync (Encrypted peer-to-peer / GitHub Gist sync)

---

## 📄 License

MIT License. Contributions, stars ⭐, and PRs are warmly welcomed!
