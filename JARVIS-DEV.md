# JARVIS Mission Control — Claude Code Dev Brain

This file is the agent-facing project brain for Claude Code CLI sessions.
Load this at the start of every coding session on this repo.

---

## What Is This?

JARVIS Mission Control is a local Node.js/Express web server + file-based task management system for the Matrix Zion multi-agent setup. It serves a Kanban dashboard at `https://zion.asif.dev` and provides a REST API for agent task coordination.

**Built by:** Matrix Zion team (Architect: M Asif Rahman)
**Primary coder:** Tank (uses Claude Code CLI)
**Live at:** https://zion.asif.dev (PRIVATE — never share publicly)
**Repo:** https://github.com/Asif2BD/JARVIS-Mission-Control-OpenClaw

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (Express) |
| Data storage | File-based JSON (`.mission-control/` directory) |
| Real-time | WebSocket (ws library) |
| File watching | chokidar |
| Logging | Pino (structured) |
| Security | CSRF (csrf library), rate limiting (express-rate-limit) |
| Tests | Jest (51 tests) |
| Process manager | PM2 (production: `ecosystem.config.cjs`) |
| Server | zion.asif.dev (46.225.104.65) |

---

## Repository Structure

```
jarvis-mc/
├── server/
│   ├── index.js              # Main Express server — ALL API routes
│   ├── agent-bridge.js       # OpenClaw session watcher → auto task cards
│   ├── webhook-delivery.js   # Webhook retry + circuit breaker
│   ├── resource-manager.js   # Resource tracking
│   ├── review-manager.js     # Review workflows
│   ├── claude-sessions.js    # Claude Code session tracking
│   ├── cli-connections.js    # CLI integration
│   ├── logger.js             # Pino logger setup
│   └── middleware/           # Express middleware
├── dashboard/                # Static Kanban dashboard (HTML/JS/CSS)
├── .mission-control/         # DATA DIRECTORY (not in git — production data)
│   ├── tasks/*.json          # One JSON file per task
│   ├── agents/*.json         # Agent registrations
│   ├── messages/*.json       # Agent messages
│   ├── logs/activity.log     # Activity log
│   └── STATE.md              # Live system state
├── tests/                    # Jest test suite
├── scripts/                  # CLI helpers
├── skill/                    # ClawHub skill files
├── CLAUDE.md                 # User adoption guide (DO NOT edit for dev use)
├── JARVIS-DEV.md             # This file — agent dev brain
└── ecosystem.config.cjs      # PM2 config
```

---

## API Routes (server/index.js)

| Method | Route | Description |
|---|---|---|
| GET | `/api/tasks` | List all tasks (reads .mission-control/tasks/) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Full update |
| PATCH | `/api/tasks/:id` | Partial update |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/agents` | List agents |
| PUT | `/api/agents/:id` | Update agent |
| GET | `/api/messages` | List messages |
| POST | `/api/messages` | Send message |
| GET | `/api/webhooks` | List webhooks |
| POST | `/api/webhooks` | Register webhook |
| DELETE | `/api/webhooks/:id` | Remove webhook |
| GET | `/api/metrics` | Server metrics |
| GET | `/api/csrf-token` | Get CSRF token |

---

## Key Architecture Notes

### Data Layer
- All data stored as JSON files in `.mission-control/`
- `readJsonDirectory(dir)` reads all `.json` files in a subdirectory — currently **sequential** (for loop with await)
- `readJsonFile(path)` reads a single file
- `writeJsonFile(path, data)` writes a single file
- chokidar watches `.mission-control/` for changes and broadcasts via WebSocket

### Real-time
- WebSocket at `ws://localhost:3000/ws`
- `broadcast(event, data)` sends to all connected clients
- `triggerWebhooks(event, data)` fires registered agent webhooks

### Security
- CSRF: Cookie-based (skips API-to-API calls without CSRF cookie)
- Rate limiting: Applied to all API routes
- Input sanitization: `sanitizeInput()` and `sanitizeId()` on all user inputs
- Path safety: `isPathSafe()` validates all file paths

### Agent Bridge
- `agent-bridge.js` watches OpenClaw JSONL session files
- Auto-creates task cards when Telegram messages mention agent bots
- Idempotent via `message_id` dedup

---

## Local Dev

```bash
cd server
npm install
node index.js         # Start server only
npm run all           # Server + agent bridge

# Run tests
cd ..
npm test

# Check tests
npm run test -- --verbose
```

Server runs on `http://localhost:3000` by default.

---

## Deployment

- **Server:** zion.asif.dev (46.225.104.65)
- **PM2:** `pm2 restart jarvis-mc` (on server)
- **SSH:** Architect-only (agents have no SSH access)
- **Deploy process:** Tank creates PR → Oracle reviews/merges → Architect pulls on server

---

## Branch & PR Rules (CRITICAL)

- **Never push to main directly**
- Tank creates feature branches → opens PRs → tags @OracleM_Bot
- Oracle reviews and merges only
- **Never include `gh pr merge` in scripts**
- PR branch: descriptive name like `fix/api-tasks-perf`

---

## Known Performance Issues

- `readJsonDirectory()` uses sequential `for...of await` — slow when many files exist
- No in-memory caching — every request hits disk
- chokidar watcher already tracks file changes (can be used to invalidate cache)

---

## Test Suite

51 Jest tests in `tests/`. Run before every PR:
```bash
npm test
```

Tests cover: API routes, webhook delivery, CSRF, rate limiting, resource manager.

---

## Critical Rules

1. **Never commit `.mission-control/` data** — it's production data, not in git
2. **Always run `npm test`** before creating a PR
3. **CSRF and rate limiting must stay active** — security v1.6.0+
4. **Never merge your own PRs** — Oracle reviews only
5. **Log all significant changes** with Pino logger
6. **Sanitize all inputs** — use `sanitizeInput()` / `sanitizeId()`

---

*Last updated: 2026-03-14 by Oracle (Matrix Zion)*
*Repo: github.com/Asif2BD/JARVIS-Mission-Control-OpenClaw*
