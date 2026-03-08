# Coding Patterns — JARVIS Mission Control

## General Rules

- **Node.js v22+** — use modern JS (async/await, optional chaining, nullish coalescing)
- **No TypeScript** — plain JS throughout
- **No database** — all data is JSON files in `.mission-control/`
- **Always sanitize** input strings using the existing `sanitizeInput()` helper in `index.js`
- **Always handle errors** — wrap file I/O in try/catch, return proper HTTP status codes

## API Route Patterns

### Standard CRUD route

```javascript
// GET all
app.get('/api/things', async (req, res) => {
  try {
    const items = await loadAllJson(path.join(MISSION_CONTROL_DIR, 'things'));
    res.json(items);
  } catch (err) {
    logger.error('Failed to load things', err);
    res.status(500).json({ error: 'Failed to load things' });
  }
});

// POST create
app.post('/api/things', csrfProtect, async (req, res) => {
  try {
    const { name, description } = req.body;
    const item = {
      id: `thing-${Date.now()}`,
      name: sanitizeInput(name),
      description: sanitizeInput(description),
      created_at: new Date().toISOString()
    };
    const filePath = path.join(MISSION_CONTROL_DIR, 'things', `${item.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(item, null, 2));
    broadcastEvent('thing.created', item);
    res.status(201).json(item);
  } catch (err) {
    logger.error('Failed to create thing', err);
    res.status(500).json({ error: 'Failed to create thing' });
  }
});
```

### Route parameter validation

Use `app.param()` for route params (NOT middleware — `app.use()` runs before params are parsed):

```javascript
app.param('id', (req, res, next, id) => {
  if (!id.match(/^[a-zA-Z0-9-_]+$/)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  next();
});
```

## WebSocket Broadcast Pattern

```javascript
function broadcastEvent(eventType, data) {
  const message = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
```

Always call `broadcastEvent()` after any data mutation so the dashboard updates in real-time.

## File I/O Helpers

```javascript
// Load all JSON files from a directory
async function loadAllJson(dir) {
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const items = await Promise.all(
    jsonFiles.map(async f => {
      const content = await fs.readFile(path.join(dir, f), 'utf8');
      return JSON.parse(content);
    })
  );
  return items;
}

// Write JSON atomically (write to temp, rename)
async function writeJsonAtomic(filePath, data) {
  const tmp = filePath + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, filePath);
}
```

## Task JSON Schema

```javascript
{
  id: 'task-YYYYMMDD-slug',           // Required
  title: 'Human readable title',       // Required
  description: 'What needs doing',     // Required
  status: 'INBOX',                     // INBOX|ASSIGNED|IN_PROGRESS|REVIEW|DONE|BLOCKED
  priority: 'medium',                  // critical|high|medium|low
  assignee: null,                      // agent-id or null
  created_by: 'agent-tank',
  created_at: '2026-03-08T00:00:00Z', // ISO 8601 with Z
  updated_at: '2026-03-08T00:00:00Z',
  labels: [],
  comments: [],
  deliverables: [],
  dependencies: [],
  blocked_by: []
}
```

## Error Response Format

Always use consistent error shapes:

```javascript
// 400 Bad Request
res.status(400).json({ error: 'Missing required field: title' });

// 404 Not Found
res.status(404).json({ error: 'Task not found', id });

// 500 Internal Server Error
res.status(500).json({ error: 'Failed to save task' });
```

## Logging

Use the existing `logger` (not `console.log`):

```javascript
const logger = require('./logger');

logger.info('Task created', { id: task.id });
logger.warn('Task not found', { id });
logger.error('Failed to write file', err);
```

## Security Checklist (before every PR)

- [ ] All user input sanitized with `sanitizeInput()`
- [ ] File paths constructed with `path.join()` (never string concat)
- [ ] No path traversal possible (validate IDs match `^[a-zA-Z0-9-_]+$`)
- [ ] Mutating routes protected with `csrfProtect` middleware
- [ ] No `console.log` left in production code (use logger)
- [ ] Error messages don't leak internal paths or stack traces
