# TaskFlow — Real-Time Task Collaboration Platform

A full-stack, real-time Kanban board application (Trello/Notion hybrid) with drag-and-drop, live collaboration, and activity tracking.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and npm
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`

### 1. Clone & Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Seed Demo Data

```bash
cd server
npm run seed
```

### 3. Start the Application

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

### Demo Credentials

| Email | Password |
|---|---|
| alice@demo.com | password123 |
| bob@demo.com | password123 |
| charlie@demo.com | password123 |

---

## ✨ Features

- **User Authentication** — JWT-based signup/login with secure bcrypt hashing
- **Boards** — Create, edit, delete boards with custom colors
- **Lists** — Create/edit/delete/reorder lists within boards
- **Tasks** — Full CRUD with drag-and-drop across lists
- **Assign Users** — Add/remove task assignees from board members
- **Real-Time Sync** — Socket.IO broadcasts all changes instantly to connected users
- **Activity History** — Tracks every action with paginated timeline sidebar
- **Search & Pagination** — Search tasks within boards; paginated board listing
- **Member Management** — Invite/remove board members with user search
- **Premium Dark UI** — Glassmorphism, animations, responsive design

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| State Management | React Context + useReducer |
| Drag & Drop | @hello-pangea/dnd |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Real-Time | Socket.IO |
| Auth | JWT, bcryptjs |
| Testing | Jest + Supertest (backend), Vitest (frontend) |

---

## 📁 Project Structure

```
├── server/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/auth.js     # JWT auth middleware
│   ├── models/               # Mongoose schemas (User, Board, List, Task, Activity)
│   ├── controllers/          # Business logic
│   ├── routes/               # Express route definitions
│   ├── socket/               # Socket.IO event handlers
│   ├── tests/                # Jest + Supertest API tests
│   ├── seed.js               # Demo data seeder
│   └── server.js             # Entry point
├── client/
│   ├── src/
│   │   ├── context/          # AuthContext, SocketContext
│   │   ├── services/api.js   # Axios API client
│   │   ├── pages/            # Login, Signup, Dashboard, Board
│   │   ├── components/       # Navbar, TaskModal, ActivitySidebar, AddMemberModal
│   │   ├── test/             # Vitest component tests
│   │   ├── index.css         # Design system
│   │   └── App.jsx           # Router + providers
│   └── vite.config.js
├── ARCHITECTURE.md           # Architecture deep-dive
├── API_DOCS.md               # API contract documentation
└── README.md
```

---

## 🧪 Running Tests

```bash
# Backend tests (requires MongoDB running)
cd server
npm test

# Frontend tests
cd client
npm test
```

---

## 🔧 Environment Variables

Backend (`server/.env`):
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=taskflow_super_secret_key_2024
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 📝 Assumptions & Trade-offs

1. **MongoDB** — Chosen for flexible schema design ideal for nested board/list/task hierarchy. Trade-off: no built-in relational integrity.
2. **JWT Auth** — Stateless auth simplifies horizontal scaling. Trade-off: no server-side session revocation without a token blacklist.
3. **Socket.IO** — Simplifies WebSocket with automatic fallback to polling. Trade-off: added server memory per connection.
4. **Optimistic UI** — Drag-and-drop updates the UI immediately and rolls back on API failure, improving perceived performance.
5. **Single DB** — No caching layer (Redis) for simplicity. For production, add Redis for session store and Socket.IO adapter.
6. **No file uploads** — Avatars use auto-generated URLs from ui-avatars.com for simplicity.

---

## 🚀 Deployment Considerations

- Use **PM2** or **Docker** for production Node.js process management
- Add **MongoDB Atlas** for managed database
- Use **Redis adapter** for Socket.IO in multi-server deployments
- **NGINX** as reverse proxy for serving frontend static files + API proxying
- Set `NODE_ENV=production` and use strong `JWT_SECRET`
- Enable **CORS** only for production frontend origin
