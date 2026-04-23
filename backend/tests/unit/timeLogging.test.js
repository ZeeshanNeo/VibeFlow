const WorkLog = require('../../src/models/WorkLog');

// Mock the database module
jest.mock('../../src/config/database', () => ({
  executeQuery: jest.fn(),
  executeQuerySingle: jest.fn(),
  executeQueryRows: jest.fn(),
}));

const { executeQuery, executeQuerySingle, executeQueryRows } = require('../../src/config/database');

describe('Time Logging Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WorkLog.create', () => {
    it('should create a work log with valid parameters', async () => {
      const mockResult = {
        outBinds: {
          id: [123]
        }
      };
      
      executeQuery.mockResolvedValue(mockResult);
      executeQuerySingle.mockResolvedValue({
        id: 123,
        task_id: 1,
        user_id: 1,
        hours_logged: 2.5,
        description: 'Test work',
        created_at: new Date().toISOString(),
        task_title: 'Test Task',
        user_email: 'test@example.com'
      });

      const workLog = await WorkLog.create(1, 1, 2.5, 'Test work');

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO WORK_LOGS'),
        expect.objectContaining({
          taskId: 1,
          userId: 1,
          hoursLogged: 2.5,
          description: 'Test work'
        })
      );

      expect(workLog).toHaveProperty('id', 123);
      expect(workLog).toHaveProperty('hours_logged', 2.5);
      expect(workLog).toHaveProperty('description', 'Test work');
    });

    it('should handle decimal hours correctly', async () => {
      const mockResult = { outBinds: { id: [124] } };
      executeQuery.mockResolvedValue(mockResult);
      executeQuerySingle.mockResolvedValue({
        id: 124,
        hours_logged: 1.75,
        description: 'Partial hour work'
      });

      const workLog = await WorkLog.create(1, 1, 1.75, 'Partial hour work');

      expect(workLog.hours_logged).toBe(1.75);
    });
  });

  describe('WorkLog.getTotalHoursByTask', () => {
    it('should return total hours for a task', async () => {
      executeQuerySingle.mockResolvedValue({ total_hours: 7.5 });

      const totalHours = await WorkLog.getTotalHoursByTask(1);

      expect(executeQuerySingle).toHaveBeenCalledWith(
        'SELECT COALESCE(SUM(hours_logged), 0) as total_hours FROM WORK_LOGS WHERE task_id = :taskId',
        [1]
      );
      expect(totalHours).toBe(7.5);
    });

    it('should return 0 when no work logs exist', async () => {
      executeQuerySingle.mockResolvedValue({ total_hours: 0 });

      const totalHours = await WorkLog.getTotalHoursByTask(999);

      expect(totalHours).toBe(0);
    });
  });

  describe('WorkLog.getProjectTotalHours', () => {
    it('should return total hours for all tasks', async () => {
      executeQuerySingle.mockResolvedValue({ project_total: 42.25 });

      const totalHours = await WorkLog.getProjectTotalHours();

      expect(executeQuerySingle).toHaveBeenCalledWith(
        'SELECT COALESCE(SUM(hours_logged), 0) as project_total FROM WORK_LOGS',
        []
      );
      expect(totalHours).toBe(42.25);
    });
  });

  describe('WorkLog.getByTaskId', () => {
    it('should return work logs for a task in descending order', async () => {
      const mockWorkLogs = [
        { id: 1, hours_logged: 2.5, description: 'Latest work' },
        { id: 2, hours_logged: 1.0, description: 'Earlier work' }
      ];
      
      executeQueryRows.mockResolvedValue(mockWorkLogs);

      const workLogs = await WorkLog.getByTaskId(1);

      expect(executeQueryRows).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY wl.created_at DESC'),
        [1]
      );
      expect(workLogs).toHaveLength(2);
      expect(workLogs[0].id).toBe(1);
    });
  });

  describe('WorkLog.getByUserId', () => {
    it('should return work logs for a user with task details', async () => {
      const mockWorkLogs = [
        { id: 1, hours_logged: 3.0, task_title: 'Task A', task_status: 'In Progress' },
        { id: 2, hours_logged: 2.0, task_title: 'Task B', task_status: 'Done' }
      ];
      
      executeQueryRows.mockResolvedValue(mockWorkLogs);

      const workLogs = await WorkLog.getByUserId(1);

      expect(executeQueryRows).toHaveBeenCalledWith(
        expect.stringContaining('JOIN TASKS t ON wl.task_id = t.id'),
        [1]
      );
      expect(workLogs).toHaveLength(2);
      expect(workLogs[0]).toHaveProperty('task_title');
      expect(workLogs[0]).toHaveProperty('task_status');
    });
  });
});