# Frontend KPI Verification Checklist

Based on the KPI contract, the following frontend features must be verified:

## 🔐 User Management & Authentication
- [ ] Login page renders correctly
- [ ] Registration page renders correctly
- [ ] Error messages display for invalid credentials
- [ ] Session persistence (token stored in localStorage)
- [ ] Logout functionality clears token

## 📋 Shared Board Visibility
- [ ] 8 columns displayed in correct order
- [ ] Task card displays Title, Assignee, Due Date, Created By
- [ ] All authenticated users see same board (requires backend)

## ✏️ Task Creation & Validation
- [ ] New task creation form with Title required
- [ ] Title length validation (max 255 chars)
- [ ] New task defaults to Backlog column
- [ ] New task has no assignee by default
- [ ] Created by field shows logged-in user

## 🖱️ Drag-and-Drop Workflow
- [ ] Tasks can be dragged between columns
- [ ] Tasks can be reordered within column
- [ ] UI updates immediately on drag
- [ ] Status persists after refresh (requires backend)

## 👤 Assignment Management & History
- [ ] Task modal contains assignee dropdown
- [ ] Assignee can be changed and saved
- [ ] Assignee can be set to Unassigned
- [ ] Assignment history displays in modal

## ⏱️ Time Logging
- [ ] "Log Work" button exists in task modal
- [ ] Time can be logged as decimal hours
- [ ] Worklog list displays in modal
- [ ] Worklogs are immutable (no edit/delete buttons)

## 📊 Time Report View
- [ ] Reports page accessible via navigation
- [ ] Report shows each task with Title, Status, Assignee, Total Hours
- [ ] Task total hours correctly sums worklogs
- [ ] Project grand total displayed

## 🧪 Testing & Documentation
- [ ] Frontend components are modular and maintainable
- [ ] Code follows clean architecture principles
- [ ] Responsive design works on mobile/tablet

## How to Test
1. Start the frontend: `npm start`
2. Navigate to `http://localhost:3000`
3. Register a new user
4. Login with credentials
5. Verify board loads with 8 columns
6. Create a new task
7. Test drag-and-drop
8. Open task modal and test assignment, work logging
9. Navigate to reports page
10. Verify all data displays correctly

## Notes
- Backend must be running for full integration
- Database must be seeded with sample data
- Some KPIs require backend verification (e.g., password hashing)