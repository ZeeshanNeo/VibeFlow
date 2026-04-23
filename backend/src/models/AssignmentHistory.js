const { executeQuery, executeQueryRows } = require('../config/database');

class AssignmentHistory {
  /**
   * Record an assignment change
   */
  static async recordChange(taskId, oldAssigneeId, newAssigneeId, changedBy) {
    const sql = `
      INSERT INTO ASSIGNMENT_HISTORY (task_id, old_assignee_id, new_assignee_id, changed_by)
      VALUES (:taskId, :oldAssigneeId, :newAssigneeId, :changedBy)
    `;
    await executeQuery(sql, [taskId, oldAssigneeId, newAssigneeId, changedBy]);
    return true;
  }

  /**
   * Get assignment history for a task with user details
   */
  static async getByTaskId(taskId) {
    const sql = `
      SELECT 
        ah.*,
        oldUser.email as old_assignee_email,
        newUser.email as new_assignee_email,
        changer.email as changed_by_email
      FROM ASSIGNMENT_HISTORY ah
      LEFT JOIN USERS oldUser ON ah.old_assignee_id = oldUser.id
      LEFT JOIN USERS newUser ON ah.new_assignee_id = newUser.id
      LEFT JOIN USERS changer ON ah.changed_by = changer.id
      WHERE ah.task_id = :taskId
      ORDER BY ah.changed_at DESC
    `;
    return await executeQueryRows(sql, [taskId]);
  }

  /**
   * Get all assignment history (for reporting)
   */
  static async getAll() {
    const sql = `
      SELECT 
        ah.*,
        t.title as task_title,
        oldUser.email as old_assignee_email,
        newUser.email as new_assignee_email,
        changer.email as changed_by_email
      FROM ASSIGNMENT_HISTORY ah
      JOIN TASKS t ON ah.task_id = t.id
      LEFT JOIN USERS oldUser ON ah.old_assignee_id = oldUser.id
      LEFT JOIN USERS newUser ON ah.new_assignee_id = newUser.id
      LEFT JOIN USERS changer ON ah.changed_by = changer.id
      ORDER BY ah.changed_at DESC
    `;
    return await executeQueryRows(sql, []);
  }

  /**
   * Get assignment changes by user
   */
  static async getByUserId(userId) {
    const sql = `
      SELECT 
        ah.*,
        t.title as task_title,
        oldUser.email as old_assignee_email,
        newUser.email as new_assignee_email,
        changer.email as changed_by_email
      FROM ASSIGNMENT_HISTORY ah
      JOIN TASKS t ON ah.task_id = t.id
      LEFT JOIN USERS oldUser ON ah.old_assignee_id = oldUser.id
      LEFT JOIN USERS newUser ON ah.new_assignee_id = newUser.id
      LEFT JOIN USERS changer ON ah.changed_by = changer.id
      WHERE ah.old_assignee_id = :userId OR ah.new_assignee_id = :userId
      ORDER BY ah.changed_at DESC
    `;
    return await executeQueryRows(sql, [userId]);
  }

  /**
   * Get recent assignment changes (last 24 hours)
   */
  static async getRecent() {
    const sql = `
      SELECT 
        ah.*,
        t.title as task_title,
        oldUser.email as old_assignee_email,
        newUser.email as new_assignee_email,
        changer.email as changed_by_email
      FROM ASSIGNMENT_HISTORY ah
      JOIN TASKS t ON ah.task_id = t.id
      LEFT JOIN USERS oldUser ON ah.old_assignee_id = oldUser.id
      LEFT JOIN USERS newUser ON ah.new_assignee_id = newUser.id
      LEFT JOIN USERS changer ON ah.changed_by = changer.id
      WHERE ah.changed_at >= SYSDATE - 1
      ORDER BY ah.changed_at DESC
    `;
    return await executeQueryRows(sql, []);
  }
}

module.exports = AssignmentHistory;
