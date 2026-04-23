# 🎨 Frontend Scope (React.js)

## Overview
Build a Jira-like Kanban UI with enterprise-level UX.

---

## 🧩 Core Features

### 1. Authentication UI
- Login page
- Registration page
- Session persistence

### 2. Kanban Board
- 8 columns:
  - Backlog
  - Todo
  - In Progress
  - Review
  - Testing
  - Done
  - Blocked
  - Archived

### 3. Task Card
- Title
- Assignee
- Due date
- Created by

### 4. Task Modal
- Edit task
- Assign user
- View history
- Log work

### 5. Drag & Drop
- Move between columns
- Reorder within column

### 6. Reports Page
- Task time summary
- Total hours

---

## ⚙️ State Management

- Global state using Redux / Context
- API sync using Axios

---

## 🎯 UX Goals

- Smooth drag-and-drop
- Instant UI updates
- Responsive design
- Clean enterprise look

---

## 🧪 Validation

- Title max 255 chars
- Required fields handling
- Error messages

---

## 🔐 Security

- Token storage (HTTP-only cookies preferred)
- Protected routes

---

## 📦 Folder Structure
src/
components/
pages/
hooks/
services/
store/
utils/


---

## 🚀 Performance

- Lazy loading
- Memoization
- Optimized renders

## Testing Scope

Frontend tests should verify:

- Drag-and-drop UI rendering
- Reports rendering
- Auth route protection