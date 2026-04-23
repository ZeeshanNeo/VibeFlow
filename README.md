# VibeFlow Kanban Board

VibeFlow is a shared Kanban board with authentication, assignee history, immutable work logs, drag-and-drop workflow, and a live time report.

## Stack

- Frontend: React, TypeScript, MUI, Redux Toolkit, `dnd-kit`
- Backend: Node.js, Express, JWT auth, Joi validation
- Database: Oracle XE
- Deployment: Docker Compose

## Features

- User registration, login, logout, and persisted sessions
- Shared board visible to every authenticated user
- 8 Kanban columns:
  `Backlog`, `Todo`, `In Progress`, `Review`, `Testing`, `Done`, `Blocked`, `Archived`
- Task creation with validation and creator tracking
- Drag-and-drop across columns and within a column
- Assignee management with assignment history
- Immutable task work logs with decimal hour support
- Live time report at `/reports/time`

## Docker Setup

### Prerequisites

- Docker Desktop
- Access to the Oracle Container Registry image used in `docker-compose.yml`

### Run the app

```bash
docker-compose up --build
```

### Application URLs

- Frontend app: `http://localhost:8080`
- Backend API: `http://localhost:8081`
- Backend health check: `http://localhost:8081/health`
- Oracle XE: `localhost:1521`

### Docker behavior

- The frontend is served by Nginx on port `8080`
- Nginx proxies `/api/*` to the backend container
- The backend runs on port `8080` inside Docker and is exposed on host port `8081`
- Oracle data persists in the `oracle-data` Docker volume

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Expected backend URL: `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm start
```

Expected frontend URL: `http://localhost:3000`

The frontend defaults to the backend at `http://localhost:8080/api` during local development.

## Test Commands

### Backend unit tests

```bash
cd backend
npm test
```

### Backend integration tests

```bash
cd backend
npm run test:integration
```

### Frontend production build

```bash
cd frontend
npm run build
```

## API Endpoints

### Auth

- `POST /api/auth/register`
  Request:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }
  ```
- `POST /api/auth/login`
  Request:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `GET /api/auth/users`

### Tasks

- `GET /api/tasks`
- `GET /api/tasks/status/:status`
  Example status values:
  `Backlog`, `Todo`, `In Progress`, `Review`, `Testing`, `Done`, `Blocked`, `Archived`
- `GET /api/tasks/:id`
- `POST /api/tasks`
  Request:
  ```json
  {
    "title": "Implement auth flow",
    "description": "Optional description",
    "assigneeId": 2,
    "dueDate": "2026-04-30"
  }
  ```
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
  Request:
  ```json
  {
    "status": "In Progress",
    "order": 2
  }
  ```
- `PATCH /api/tasks/reorder`
  Request:
  ```json
  {
    "status": "Todo",
    "taskIds": [4, 1, 7]
  }
  ```
- `DELETE /api/tasks/:id`

### Assignment History

- `PATCH /api/assignments/tasks/:id/assign`
  Request:
  ```json
  {
    "assigneeId": 3
  }
  ```
  Use `null` for unassigning.
- `GET /api/assignments/tasks/:id/history`
- `GET /api/assignments/history`
- `GET /api/assignments/my-history`
- `GET /api/assignments/recent`

### Work Logs

- `POST /api/worklogs/tasks/:id`
  Request:
  ```json
  {
    "hoursLogged": 2.5,
    "description": "Implemented validation and modal UX"
  }
  ```
- `GET /api/worklogs/tasks/:id`
- `GET /api/worklogs/my-logs`
- `GET /api/worklogs/daily-summary`
- `GET /api/worklogs/user-summary`
- `GET /api/worklogs`
- `GET /api/worklogs/project-total`

### Reports

- `GET /api/reports/time`
- `GET /api/reports/time/detailed`
- `GET /api/reports/statistics`
- `GET /api/reports/assignments`

## KPI Notes

- Login page is intended to load at `http://localhost:8080` in Docker
- Time report UI is available at `/reports/time`
- Work logs are immutable in the UI and backend model layer
- Assignment history is shown newest first
