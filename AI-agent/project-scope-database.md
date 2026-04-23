# Database Scope - VibeFlow Kanban Board

## Database Engine

Oracle SQL Developer

Connection:

Data Source=DESKTOP-8RJAQKG;Integrated Security=True;

---

## Tables

### 1. USERS

Columns:

- id (PK)
- email (unique)
- password_hash
- created_at

Purpose:
Store registered users.

KPIs Covered:
1–6

---

### 2. TASKS

Columns:

- id (PK)
- title
- status
- assignee_id (nullable)
- due_date (nullable)
- created_by
- position
- created_at

Purpose:
Store all board tasks.

KPIs Covered:
7–18

---

### 3. ASSIGNMENT_HISTORY

Columns:

- id (PK)
- task_id
- old_assignee_id
- new_assignee_id
- changed_by
- changed_at

Purpose:
Track assignment changes.

KPIs Covered:
19–24

---

### 4. WORK_LOGS

Columns:

- id (PK)
- task_id
- user_id
- hours_logged
- description
- created_at

Purpose:
Track time logs.

KPIs Covered:
25–34

---

## 🔗 Relationships

- Task → User (assignee)
- Task → User (created_by)
- Worklog → Task
- Worklog → User
- AssignmentHistory → Task

## Constraints

Implement:

- Foreign keys
- Cascade protection
- NOT NULL where needed
- Unique email constraint

---

## Indexes

Create indexes on:

- TASKS.status
- TASKS.position
- WORK_LOGS.task_id
- ASSIGNMENT_HISTORY.task_id

---

## Data Rules

### Task Title
- Required
- Max 255 chars

### Assignee
- Nullable

### Work Hours
- Decimal
- Positive only

---

## Reporting Queries

Must support:

1. Sum worklogs per task
2. Sum total project hours
3. Join tasks + assignee

KPIs Covered:
30–34