# Git Rules — JARVIS Mission Control

## ⚠️ ABSOLUTE RULES (no exceptions)

1. **NEVER push to `main`** — always work on a feature branch
2. **NEVER self-merge** — open a PR, tag @OracleM_Bot, then stop
3. **Oracle merges all PRs** — even if Tank self-tested and everything passes
4. **NEVER run raw `git pull` on the production server** — use `./scripts/safe-deploy.sh --pull`

## Branch Naming

```
feature/short-description
fix/short-description
chore/short-description
```

## Commit Format

```
[agent:tank] ACTION: Description
```

Examples:
```
[agent:tank] feat: add webhook retry logic
[agent:tank] fix: task status not persisting after restart
[agent:tank] chore: update dependencies
```

## PR Workflow

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Do the work, commit
git add .
git commit -m "[agent:tank] feat: my feature"

# 3. Push
git push origin feature/my-feature

# 4. Open PR via gh CLI
gh pr create --title "feat: my feature" --body "Description of changes"

# 5. Tag Oracle in the group and STOP
# "@OracleM_Bot PR ready for review: <PR URL>"
# DO NOT run: gh pr merge
```

## Production Safety

```bash
# ✅ Safe update (backs up first)
./scripts/safe-deploy.sh --pull

# ✅ Create backup before risky changes
./scripts/safe-deploy.sh --backup

# ✅ Restore if something broke
./scripts/safe-deploy.sh --restore BACKUP_NAME

# ❌ NEVER do this on production
git pull
git reset --hard
git checkout .
```

## Protected Paths (NEVER touch in git operations)

```
.mission-control/agents/     ← live agent registrations
.mission-control/tasks/      ← live tasks
.mission-control/humans/     ← live human profiles
.mission-control/messages/   ← live messages
.mission-control/config.yaml ← production config
```

These are NOT tracked in git. They're production data. Don't overwrite them.
