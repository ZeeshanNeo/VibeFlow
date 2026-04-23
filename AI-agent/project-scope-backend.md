# 🧠 Backend Scope (Node.js + Express)

## Overview
Responsible for building a scalable REST API to support the Kanban board system.

---

## 🧩 Modules

### 1. Authentication
- Register user
- Login user
- JWT token generation
- Password hashing (bcrypt)

### 2. Task Management
- Create task
- Update task
- Move task (status update)
- Reorder tasks
- Fetch all tasks

### 3. Assignment Management
- Assign user to task
- Remove assignment
- Store assignment history

### 4. Worklog Management
- Log time (decimal hours)
- Immutable entries
- Fetch worklogs per task

### 5. Reporting
- Total time per task
- Grand total time

---

## 📡 API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

### Tasks
- GET /api/tasks
- POST /api/tasks
- PUT /api/tasks/:id
- PATCH /api/tasks/:id/status
- PATCH /api/tasks/:id/reorder

### Assignment
- PATCH /api/tasks/:id/assign

### Worklog
- POST /api/tasks/:id/worklog
- GET /api/tasks/:id/worklog

### Reports
- GET /api/reports/time

---

## 🧱 Architecture

- Controllers → Handle requests
- Services → Business logic
- Repositories → DB queries
- Middleware → Auth, validation

---

## 🔐 Security

- JWT middleware
- Protected routes
- Input validation (Joi/Zod)

---

## 🧪 Testing

- Unit tests for:
  - Time calculation
  - Assignment history
  - Business logic

---

## 🐳 Docker

- Node container
- API runs on port 8080