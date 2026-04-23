const AssignmentHistory = require('../../src/models/AssignmentHistory');

// Mock the database module
jest.mock('../../src/config/database', () => ({
  executeQuery: jest.fn(),
  executeQueryRows: jest.fn(),
}));

const { executeQuery, executeQueryRows } = require('../../src/config/database');

describe('Assignment History Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AssignmentHistory.recordChange', () => {
    it('should record an assignment change with all parameters', async () => {
      executeQuery.mockResolvedValue({});

      const result = await AssignmentHistory.recordChange(1, null, 2, 3);

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ASSIGNMENT_HISTORY'),
        [1, null, 2, 3]
      );
      expect(result).toBe(true);
    });

    it('should handle unassignment (new assignee is null)', async () => {
      executeQuery.mockResolvedValue({});

      const result = await AssignmentHistory.recordChange(1, 2, null, 3);

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ASSIGNMENT_HISTORY'),
        [1, 2, null, 3]
      );
      expect(result).toBe(true);
    });

    it('should handle initial assignment (old assignee is null)', async () => {
      executeQuery.mockResolvedValue({});

      const result = await AssignmentHistory.recordChange(1, null, 2, 3);

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ASSIGNMENT_HISTORY'),
        [1, null, 2, 3]
      );
      expect(result).toBe(true);
    });
  });

  describe('AssignmentHistory.getByTaskId', () => {
    it('should return assignment history for a task with user details', async () => {
      const mockHistory = [
        {
          id: 1,
          task_id: 1,
          old_assignee_id: null,
          new_assignee_id: 2,
          changed_by: 3,
          changed_at: '2023-10-01T10:00:00Z',
          old_assignee_email: null,
          new_assignee_email: 'user2@example.com',
          changed_by_email: 'admin@example.com'
        }
      ];

      executeQueryRows.mockResolvedValue(mockHistory);

      const history = await AssignmentHistory.getByTaskId(1);

      expect(executeQueryRows).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY ah.changed_at DESC'),
        [1]
      );
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('new_assignee_email', 'user2@example.com');
      expect(history[0]).toHaveProperty('changed_by_email', 'admin@example.com');
    });

    it('should return empty array when no history exists', async () => {
      executeQueryRows.mockResolvedValue([]);

      const history = await AssignmentHistory.getByTaskId(999);

      expect(history).toHaveLength(0);
    });
  });

  describe('AssignmentHistory.getAll', () => {
    it('should return all assignment history with task and user details', async () => {
      const mockHistory = [
        {
          id: 1,
          task_id: 1,
          task_title: 'Task 1',
          old_assignee_email: 'user1@example.com',
          new_assignee_email: 'user2@example.com',
          changed_by_email: 'admin@example.com',
          changed_at: '2023-10-01T10:00:00Z'
        }
      ];

      executeQueryRows.mockResolvedValue(mockHistory);

      const history = await AssignmentHistory.getAll();

      expect(executeQueryRows).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY ah.changed_at DESC'),
        []
      );
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('task_title', 'Task 1');
    });
  });

  describe('AssignmentHistory.getByUserId', () => {
    it('should return assignment history for a user', async () => {
      const mockHistory = [
        {
          id: 1,
          task_id: 1,
          task_title: 'Task 1',
          old_assignee_id: 1,
          new_assignee_id: 2,
          changed_at: '2023-10-01T10:00:00Z'
        }
      ];

      executeQueryRows.mockResolvedValue(mockHistory);

      const history = await AssignmentHistory.getByUserId(1);

      expect(executeQueryRows).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ah.old_assignee_id = :userId OR ah.new_assignee_id = :userId'),
        [1]
      );
      expect(history).toHaveLength(1);
    });
  });

  describe('AssignmentHistory.getRecent', () => {
    it('should return recent assignment changes (last 24 hours)', async () => {
      const mockHistory = [
        {
          id: 1,
          task_id: 1,
          task_title: 'Task 1',
          changed_at: '2023-10-01T10:00:00Z'
        }
      ];

      executeQueryRows.mockResolvedValue(mockHistory);

      const history = await AssignmentHistory.getRecent();

      expect(executeQueryRows).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ah.changed_at >= SYSDATE - 1'),
        []
      );
      expect(history).toHaveLength(1);
    });
  });

  describe('Assignment history ordering', () => {
    it('should return history in correct chronological order (most recent first)', async () => {
      const mockHistory = [
        {
          id: 2,
          changed_at: '2023-10-02T10:00:00Z'
        },
        {
          id: 1,
          changed_at: '2023-10-01T10:00:00Z'
        }
      ];

      executeQueryRows.mockResolvedValue(mockHistory);

      const history = await AssignmentHistory.getByTaskId(1);

      // Verify the SQL includes ORDER BY DESC
      const sqlCall = executeQueryRows.mock.calls[0][0];
      expect(sqlCall).toContain('ORDER BY ah.changed_at DESC');
      
      // The mock returns in DESC order
      expect(history[0].id).toBe(2);
      expect(history[1].id).toBe(1);
    });
  });
});