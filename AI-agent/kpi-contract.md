Build the JIRA Kanban board similar to this - https://www.atlassian.com/software/jira/templates/kanban
 
Here are the **Key Performance Indicators (KPIs)** to evaluate whether the VibeFlow Kanban Board is "Done" and meets the scope requirements.
 
---
 
## Completion KPIs: VibeFlow Kanban Board
 
These KPIs are grouped by functional area and are designed to be **binary** (Pass/Fail). All must be **Pass** for the assignment to be considered complete.
 
---
 
### 🔐 User Management & Authentication
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 1 | User can register with email and password | Create a new account via UI; confirm success redirect/message. |
| 2 | Registered user can log in successfully | Log in with created credentials; session established. |
| 3 | Invalid login credentials are rejected with appropriate error | Attempt login with wrong password; see error message. |
| 4 | Session persists after browser restart | Close and reopen browser; user remains logged in. |
| 5 | User can log out and session is terminated | Click logout; attempt to access protected page; redirected to login. |
| 6 | Password is stored hashed (not plaintext) | Inspect database; password column contains bcrypt hash or similar. |
 
---
 
### 📋 Shared Board Visibility
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 7 | All authenticated users see the same board and tasks | Log in as User A, create a task. Log in as User B; verify task is visible. |
| 8 | Board displays all 8 columns in correct order | Visual inspection of UI. |
| 9 | Task card displays: Title, Assignee (if any), Due Date (if any), Created By | Create task with all fields; verify all information appears on card. |
 
---
 
### ✏️ Task Creation & Validation
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 10 | New task creation requires only Title | Submit form with only Title; task created successfully. |
| 11 | Title exceeding 255 characters is rejected | Attempt to create task with 300-character title; receive error. |
| 12 | New task defaults to `Backlog` column | Create task; verify it appears in the Backlog column. |
| 13 | New task has no assignee by default | Create task; verify Assignee field is empty/blank. |
| 14 | New task records the creating user as `created_by` | Create task; verify "Created By" shows the logged-in user's email/name. |
| 15 | New task appears at the bottom of the Backlog column | Create multiple tasks; verify newest is last in list. |
 
---
 
### 🖱️ Drag-and-Drop Workflow
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 16 | Task can be dragged from one column to another | Drag a task card; drop in different column; UI updates immediately. |
| 17 | Status change persists after page refresh | Drag task to new column, refresh page; task remains in new column. |
| 18 | Tasks can be reordered within the same column | Drag task vertically; order changes and persists after refresh. |
 
---
 
### 👤 Assignment Management & History
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 19 | Task modal contains a dropdown of all registered users for assignee | Open modal; dropdown lists all users. |
| 20 | Assignee can be changed and saved | Select new assignee, save; task card updates. |
| 21 | Assignee can be set to "Unassigned" (null) | Select empty option, save; assignee removed. |
| 22 | Assignment history is recorded when assignee changes | Change assignee; check AssignmentHistory table for new record. |
| 23 | Assignment history displays in task modal | Open modal; see list of changes with old/new values, who changed, and timestamp. |
| 24 | Assignment history shows correct chronological order (most recent first) | Make multiple changes; verify order in UI. |
 
---
 
### ⏱️ Time Logging
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 25 | "Log Work" button exists in task modal | Open any task modal; button is visible. |
| 26 | Time can be logged as decimal hours (e.g., 2.5) | Enter 2.5, add description, save; worklog created. |
| 27 | Worklog is associated with the logged-in user | Log time as User A; check worklog record has correct user_id. |
| 28 | Worklog is immutable (cannot edit or delete via UI) | No edit/delete buttons present for existing worklogs. |
| 29 | Multiple worklogs can be added to the same task | Log time twice; both appear in database. |
 
---
 
### 📊 Time Report View
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 30 | Dedicated report page exists and is navigable | Click nav link; page loads at `/reports/time`. |
| 31 | Report shows each task with Title, Status, Assignee, and Total Hours | Verify all fields present for each task. |
| 32 | Task total hours correctly sums all worklogs for that task | Manually sum worklogs; compare with displayed total. |
| 33 | Project grand total correctly sums all worklogs across all tasks | Manually sum all worklogs; compare with grand total. |
| 34 | Report is accessible to any logged-in user | Log in as any user; report page loads. |
 
---
 
### 🐳 Docker & Deployment
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 35 | `docker-compose up` builds and starts the application without errors | Run command; observe successful container startup. |
| 36 | Application is accessible at `http://localhost:8080` | Open browser to URL; login page loads. |
| 37 | Database file persists in a Docker volume/mount | Stop and restart container; previously created data remains. |
| 38 | All application features work inside the Docker container | Perform a smoke test of key features (create task, drag, log time). |
 
---
 
### 🧪 Testing & Documentation
 
| # | KPI | Verification Method |
| :-- | :-- | :-- |
| 39 | Unit test exists for time logging logic | Check test suite; run tests; verify pass. |
| 40 | Unit test exists for assignment history creation | Check test suite; run tests; verify pass. |
| 41 | Unit test exists for time report calculation | Check test suite; run tests; verify pass. |
| 42 | All unit tests pass | Run test command; observe all green. |
| 43 | README.md contains clear Docker setup instructions | Read README; follow steps; app starts without guesswork. |
| 44 | API endpoints are documented (in README or separate file) | Locate documentation; contains list of endpoints and example payloads. |
 
---