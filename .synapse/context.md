# 🧠 Synapse Shared Context: synapse
> *Last Updated: 2026-11-24T07:43:47.286Z*

## 🎯 Current Active Goal
Re-architecting database to PostgreSQL with Drizzle ORM

## 📜 Project Conventions & Rules
- Always use TypeScript strict mode
- Never commit .env files

## 💡 Key Architectural Decisions (Recent)
### [Claude Code] Switched from bcrypt to argon2id for password hashing (3:43:47 PM)
- **Rationale:** Argon2id is memory-hard and recommended by OWASP 2026
- **Components:** `src/auth/hash.ts`, `src/auth/service.ts`
### [User/CLI] Selected TypeScript and MCP stdio architecture (3:08:04 PM)

## ⏱️ Recent Agent Activity Timeline
- **[3:43:47 PM] [Claude Code]** `decision`: Decision: Switched from bcrypt to argon2id for password hashing
- **[3:43:47 PM] [Developer]** `note`: Added project convention: Never commit .env files
- **[3:43:47 PM] [Cursor]** `note`: Added project convention: Always use TypeScript strict mode
- **[3:43:47 PM] [Claude Code]** `milestone`: Active goal updated: Re-architecting database to PostgreSQL with Drizzle ORM
- **[3:08:04 PM] [User/CLI]** `decision`: Decision: Selected TypeScript and MCP stdio architecture
- **[3:08:04 PM] [User/CLI]** `milestone`: Active goal updated: Build viral open source project Synapse

---
*Generated automatically by Synapse. Synced across all AI agents.*