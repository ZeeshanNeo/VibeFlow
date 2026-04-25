const { executeQuery, executeQueryRows } = require('../config/database');

class ActivityLog {
  /**
   * Record a new activity
   * @param {number} taskId 
   * @param {number} userId 
   * @param {string} action 'CREATED', 'STATUS_CHANGE', 'ASSIGNEE_CHANGE', 'COMMENT_ADDED'
   * @param {string} oldValue 
   * @param {string} newValue 
   */
  static async record(taskId, userId, action, oldValue = null, newValue = null) {
    const sql = `
      INSERT INTO ACTIVITY_LOGS (task_id, user_id, action, old_value, new_value)
      VALUES (:taskId, :userId, :action, :oldValue, :newValue)
    `;
    await executeQuery(sql, { taskId, userId, action, oldValue, newValue });
    return true;
  }

  /**
   * Get activity logs for a specific task
   */
  static async getByTaskId(taskId) {
    const sql = `
      SELECT 
        al.*,
        u.email as user_email,
        u.name as user_name
      FROM ACTIVITY_LOGS al
      JOIN USERS u ON al.user_id = u.id
      WHERE al.task_id = :taskId
      ORDER BY al.created_at DESC
    `;
    return await executeQueryRows(sql, { taskId });
  }
}

module.exports = ActivityLog;
