# API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <token>`

---

## Authentication

### POST /auth/signup
Register a new user.

**Body:**
```json
{ "name": "Alice", "email": "alice@demo.com", "password": "password123" }
```
**Response (201):**
```json
{
  "token": "eyJhb...",
  "user": { "_id": "...", "name": "Alice", "email": "alice@demo.com", "avatar": "https://..." }
}
```

### POST /auth/login
**Body:**
```json
{ "email": "alice@demo.com", "password": "password123" }
```
**Response (200):** Same as signup.

### GET /auth/me 🔒
**Response (200):**
```json
{ "user": { "_id": "...", "name": "Alice", "email": "alice@demo.com", "avatar": "..." } }
```

### GET /auth/users/search?q=bob 🔒
**Response (200):** `[{ "_id": "...", "name": "Bob", "email": "bob@demo.com", "avatar": "..." }]`

---

## Boards

### GET /boards?page=1&limit=12&search=launch 🔒
**Response (200):**
```json
{
  "boards": [{ "_id": "...", "title": "Product Launch", "owner": {...}, "members": [...], "background": "#6366f1" }],
  "pagination": { "page": 1, "limit": 12, "total": 3, "pages": 1 }
}
```

### POST /boards 🔒
**Body:**
```json
{ "title": "New Board", "description": "optional", "background": "#10b981" }
```
**Response (201):** Board object with populated owner and members.

### GET /boards/:id 🔒
**Response (200):**
```json
{
  "board": { "_id": "...", "title": "...", "members": [...] },
  "lists": [{ "_id": "...", "title": "To Do", "position": 0 }],
  "tasks": [{ "_id": "...", "title": "Task 1", "list": "...", "position": 0, "assignees": [...] }]
}
```

### PUT /boards/:id 🔒
**Body:** `{ "title": "Updated Title" }`
**Response (200):** Updated board.

### DELETE /boards/:id 🔒
**Response (200):** `{ "message": "Board deleted successfully" }`
Cascade deletes all lists, tasks, and activity.

### POST /boards/:id/members 🔒
**Body:** `{ "userId": "..." }`
**Response (200):** Updated board.

### DELETE /boards/:id/members/:userId 🔒
**Response (200):** Updated board.

---

## Lists

### POST /boards/:boardId/lists 🔒
**Body:** `{ "title": "In Progress" }`
**Response (201):** List object.

### PUT /lists/:id 🔒
**Body:** `{ "title": "Updated List" }`
**Response (200):** Updated list.

### DELETE /lists/:id 🔒
**Response (200):** `{ "message": "List deleted successfully" }`

### PUT /lists/reorder 🔒
**Body:** `{ "lists": [{ "_id": "...", "position": 0 }, { "_id": "...", "position": 1 }] }`
**Response (200):** `{ "message": "Lists reordered" }`

---

## Tasks

### POST /lists/:listId/tasks 🔒
**Body:**
```json
{
  "title": "Implement feature",
  "description": "Details here",
  "priority": "high",
  "dueDate": "2024-03-15",
  "labels": [{ "text": "Frontend", "color": "#8b5cf6" }]
}
```
**Response (201):** Task object with populated assignees.

### PUT /tasks/:id 🔒
**Body:** `{ "title": "Updated", "priority": "urgent" }`
**Response (200):** Updated task.

### DELETE /tasks/:id 🔒
**Response (200):** `{ "message": "Task deleted successfully" }`

### PUT /tasks/reorder 🔒
Move task across lists or reorder within a list.
**Body:**
```json
{
  "taskId": "...",
  "sourceListId": "...",
  "destinationListId": "...",
  "newPosition": 2
}
```
**Response (200):** `{ "message": "Task reordered", "task": {...} }`

### PUT /tasks/:id/assign 🔒
**Body:** `{ "userId": "...", "action": "assign" }` (or `"unassign"`)
**Response (200):** Updated task.

### GET /boards/:boardId/tasks/search?q=feature&page=1 🔒
**Response (200):**
```json
{
  "tasks": [...],
  "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
}
```

---

## Activity

### GET /boards/:boardId/activity?page=1&limit=20 🔒
**Response (200):**
```json
{
  "activities": [
    {
      "_id": "...",
      "user": { "name": "Alice", "avatar": "..." },
      "action": "created_task",
      "entityType": "task",
      "entityTitle": "Implement feature",
      "details": "",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 12, "pages": 1 }
}
```

---

## WebSocket Events

**Connection:** `io('http://localhost:5000', { auth: { token } })`

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `board:join` | `boardId` | Join board room |
| `board:leave` | `boardId` | Leave board room |

### Server → Client (broadcast to board room)
| Event | Payload | Trigger |
|---|---|---|
| `task:created` | Task object | Task created |
| `task:updated` | Task object | Task updated / assigned |
| `task:deleted` | `{ taskId, listId }` | Task deleted |
| `task:moved` | `{ task, sourceListId, destinationListId }` | Task dragged |
| `list:created` | List object | List created |
| `list:updated` | List object | List renamed |
| `list:deleted` | `{ listId, boardId }` | List deleted |
| `member:added` | `{ board, member }` | Member invited |
| `member:removed` | `{ board, userId }` | Member removed |
| `board:updated` | Board object | Board edited |
| `board:deleted` | `{ boardId }` | Board deleted |

---

## Health Check

### GET /health
**Response (200):** `{ "status": "OK", "timestamp": "..." }`

---

## Error Responses
All errors follow the format:
```json
{ "message": "Error description" }
```

| Status | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not a board member/owner) |
| 404 | Resource not found |
| 500 | Server error |
