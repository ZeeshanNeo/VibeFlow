Weaknesses & Actionable Fixes

1. Oracle XE Deployment Complexity
Location: docker‑compose.yml uses custom Oracle image.
What was done: Oracle XE requires specific licensing and larger resource footprint.
Why it's a problem with quantified risks: Harder to deploy in cloud environments compared to
PostgreSQL/MySQL; longer startup time. Increases deployment time by 30-50% and requires 2GB+ RAM.
What the developer did wrong: Chose enterprise database for a project that could use simpler
alternatives.
Suggested improvement: Provide alternative docker‑compose‑postgres.yml for developers who
prefer a more common database.
Priority: Medium

2. SQL Repetition Across Models
Location: Task.js, AssignmentHistory.js, WorkLog.js have similar safeNumber() and basic
CRUD patterns.
What was done: Each model reimplements similar database interaction logic.
Why it's a problem with quantified risks: Changes to database layer require updates in multiple files.
Increases maintenance effort by 20-30%.
What the developer did wrong: Didn't extract common database operations into reusable components.
Suggested improvement: Extract common database operations into a base Model class or repository
pattern.
Priority: Low

3. Frontend Structure Not Fully Visible
Location: Frontend directory structure not detailed in review.
What was done: Assumed to be React + TypeScript + MUI based on README.
Why it's a problem with quantified risks: Potential inconsistencies or missing frontend tests. Could lead
to UI bugs and poor user experience.
What the developer did wrong: Didn't provide complete frontend documentation or ensure frontend test
coverage.
Suggested improvement: Ensure frontend has equivalent test coverage and follows component‑based
architecture.
Priority: Low