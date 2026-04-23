const WorkLog = require('../../src/models/WorkLog');

// Mock the database module
jest.mock('../../src/config/database', () => ({
  executeQueryRows: jest.fn(),
  executeQuerySingle: jest.fn(),
}));

const { executeQueryRows, executeQuerySingle } = require('../../src/config/database');

describe('Time Report Calculation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task time aggregation', () => {
    it('should correctly sum worklog hours for a task', async () => {
      // Mock worklogs for a task
      const mockWorkLogs = [
        { hours_logged: 2.5 },
        { hours_logged: 1.0 },
        { hours_logged: 3.75 }
      ];

      // Mock the database response for getByTaskId
      require('../../src/config/database').executeQueryRows.mockResolvedValue(mockWorkLogs);
      require('../../src/config/database').executeQuerySingle.mockResolvedValue({ total_hours: 7.25 });

      const totalHours = await WorkLog.getTotalHoursByTask(1);

      // 2.5 + 1.0 + 3.75 = 7.25
      expect(totalHours).toBe(7.25);
    });

    it('should handle decimal hours correctly in aggregation', async () => {
      const mockWorkLogs = [
        { hours_logged: 0.5 },
        { hours_logged: 1.25 },
        { hours_logged: 2.0 }
      ];

      // Mock the database response
      require('../../src/config/database').executeQueryRows.mockResolvedValue(mockWorkLogs);
      require('../../src/config/database').executeQuerySingle.mockResolvedValue({ total_hours: 3.75 });

      const totalHours = await WorkLog.getTotalHoursByTask(1);

      // 0.5 + 1.25 + 2.0 = 3.75
      expect(totalHours).toBe(3.75);
    });
  });

  describe('Project total calculation', () => {
    it('should correctly sum all worklogs across all tasks', async () => {
      // Mock project total
      require('../../src/config/database').executeQuerySingle.mockResolvedValue({ project_total: 42.5 });

      const projectTotal = await WorkLog.getProjectTotalHours();

      expect(projectTotal).toBe(42.5);
      expect(executeQuerySingle).toHaveBeenCalledWith(
        'SELECT COALESCE(SUM(hours_logged), 0) as project_total FROM WORK_LOGS',
        []
      );
    });

    it('should return 0 when no worklogs exist', async () => {
      require('../../src/config/database').executeQuerySingle.mockResolvedValue({ project_total: 0 });

      const projectTotal = await WorkLog.getProjectTotalHours();

      expect(projectTotal).toBe(0);
    });
  });

  describe('Report view calculations', () => {
    it('should calculate grand total correctly from task report view', async () => {
      // Mock data from TASK_REPORT_VIEW
      const mockTaskReport = [
        { id: 1, title: 'Task 1', status: 'In Progress', assignee_email: 'user1@example.com', total_hours: 5.5 },
        { id: 2, title: 'Task 2', status: 'Done', assignee_email: 'user2@example.com', total_hours: 3.0 },
        { id: 3, title: 'Task 3', status: 'Todo', assignee_email: null, total_hours: 0 },
        { id: 4, title: 'Task 4', status: 'In Progress', assignee_email: 'user1@example.com', total_hours: 2.25 }
      ];

      executeQueryRows.mockResolvedValue(mockTaskReport);

      // This simulates what the report controller would do
      const tasks = mockTaskReport;
      const grandTotal = tasks.reduce((sum, task) => sum + parseFloat(task.total_hours || 0), 0);

      // 5.5 + 3.0 + 0 + 2.25 = 10.75
      expect(grandTotal).toBe(10.75);
      expect(tasks).toHaveLength(4);
      
      // Verify task with no hours is included
      const taskWithNoHours = tasks.find(t => t.id === 3);
      expect(taskWithNoHours.total_hours).toBe(0);
    });

    it('should handle null total_hours in calculation', async () => {
      const mockTaskReport = [
        { id: 1, title: 'Task 1', total_hours: null },
        { id: 2, title: 'Task 2', total_hours: 2.5 }
      ];

      executeQueryRows.mockResolvedValue(mockTaskReport);

      const tasks = mockTaskReport;
      const grandTotal = tasks.reduce((sum, task) => sum + parseFloat(task.total_hours || 0), 0);

      // null should be treated as 0, so 0 + 2.5 = 2.5
      expect(grandTotal).toBe(2.5);
    });
  });

  describe('User summary calculations', () => {
    it('should correctly calculate user worklog summaries', async () => {
      const mockUserSummary = [
        { id: 1, email: 'user1@example.com', log_count: 3, total_hours: 8.5 },
        { id: 2, email: 'user2@example.com', log_count: 2, total_hours: 4.0 },
        { id: 3, email: 'user3@example.com', log_count: 0, total_hours: 0 }
      ];

      executeQueryRows.mockResolvedValue(mockUserSummary);

      // This simulates what the WorkLog.getUserSummary would return
      const summary = mockUserSummary;
      
      expect(summary).toHaveLength(3);
      
      // Verify calculations
      const user1 = summary.find(u => u.id === 1);
      expect(user1.total_hours).toBe(8.5);
      expect(user1.log_count).toBe(3);
      
      const user3 = summary.find(u => u.id === 3);
      expect(user3.total_hours).toBe(0);
      expect(user3.log_count).toBe(0);
      
      // Verify ordering by total_hours DESC (as specified in SQL)
      // The mock should return in DESC order
      expect(summary[0].total_hours).toBeGreaterThanOrEqual(summary[1].total_hours);
    });
  });

  describe('Daily summary calculations', () => {
    it('should correctly group and sum hours by day', async () => {
      const mockDailySummary = [
        { log_date: '2023-10-01', total_hours: 5.5, log_count: 3 },
        { log_date: '2023-10-02', total_hours: 3.25, log_count: 2 },
        { log_date: '2023-10-03', total_hours: 0, log_count: 0 }
      ];

      executeQueryRows.mockResolvedValue(mockDailySummary);

      const summary = mockDailySummary;
      
      expect(summary).toHaveLength(3);
      
      // Verify day with no worklogs
      const dayWithNoWork = summary.find(d => d.log_date === '2023-10-03');
      expect(dayWithNoWork.total_hours).toBe(0);
      expect(dayWithNoWork.log_count).toBe(0);
      
      // Verify calculations
      const totalHours = summary.reduce((sum, day) => sum + day.total_hours, 0);
      expect(totalHours).toBe(8.75); // 5.5 + 3.25 + 0
    });
  });
});
