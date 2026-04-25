const { executeQuery, executeQueryRows, executeQuerySingle } = require('../config/database');

class WorkLog {
  /**
   * Create a work log entry (immutable)
   */
  static async create(taskId, userId, hoursLogged, description) {
    const sql = `
      INSERT INTO WORK_LOGS (task_id, user_id, hours_logged, description)
      VALUES (:taskId, :userId, :hoursLogged, :description)
      RETURNING id INTO :id
    `;
    
    const binds = {
      taskId,
      userId,
      hoursLogged,
      description,
      id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
    };

    const result = await executeQuery(sql, binds);
    const workLogId = result.outBinds.id[0];
    
    return await this.findById(workLogId);
  }

  /**
   * Find work log by ID with details
   */
  static async findById(id) {
    const sql = `
      SELECT 
        wl.*,
        t.title as task_title,
        u.email as user_email
      FROM WORK_LOGS wl
      JOIN TASKS t ON wl.task_id = t.id
      JOIN USERS u ON wl.user_id = u.id
      WHERE wl.id = :id
    `;
    return await executeQuerySingle(sql, { id });
  }

  /**
   * Get all work logs for a task
   */
  static async getByTaskId(taskId) {
    const sql = `
      SELECT 
        wl.*,
        u.email as user_email
      FROM WORK_LOGS wl
      JOIN USERS u ON wl.user_id = u.id
      WHERE wl.task_id = :taskId
      ORDER BY wl.created_at DESC
    `;
    return await executeQueryRows(sql, { taskId });
  }

  /**
   * Get all work logs for a user
   */
  static async getByUserId(userId) {
    const sql = `
      SELECT 
        wl.*,
        t.title as task_title,
        t.status as task_status
      FROM WORK_LOGS wl
      JOIN TASKS t ON wl.task_id = t.id
      WHERE wl.user_id = :userId
      ORDER BY wl.created_at DESC
    `;
    return await executeQueryRows(sql, { userId });
  }

  /**
   * Get total hours logged for a task
   */
  static async getTotalHoursByTask(taskId) {
    const sql = 'SELECT COALESCE(SUM(hours_logged), 0) as total_hours FROM WORK_LOGS WHERE task_id = :taskId';
    const result = await executeQuerySingle(sql, { taskId });
    return result.total_hours;
  }

  /**
   * Get total hours logged for all tasks (project total)
   */
  static async getProjectTotalHours() {
    const sql = 'SELECT COALESCE(SUM(hours_logged), 0) as project_total FROM WORK_LOGS';
    const result = await executeQuerySingle(sql, []);
    return result.project_total;
  }

  /**
   * Get work logs with pagination (for reporting)
   */
  static async getPaginated(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT 
        wl.*,
        t.title as task_title,
        u.email as user_email
      FROM WORK_LOGS wl
      JOIN TASKS t ON wl.task_id = t.id
      JOIN USERS u ON wl.user_id = u.id
      ORDER BY wl.created_at DESC
      OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
    `;
    return await executeQueryRows(sql, { offset, limit });
  }

  /**
   * Get work log summary by day
   */
  static async getDailySummary(days = 7) {
    const sql = `
      SELECT 
        TRUNC(created_at) as log_date,
        SUM(hours_logged) as total_hours,
        COUNT(*) as log_count
      FROM WORK_LOGS
      WHERE created_at >= SYSDATE - :days
      GROUP BY TRUNC(created_at)
      ORDER BY log_date DESC
    `;
    return await executeQueryRows(sql, { days });
  }

  /**
   * Get work log summary by user
   */
  static async getUserSummary() {
    const sql = `
      SELECT 
        u.id,
        u.email,
        COUNT(wl.id) as log_count,
        COALESCE(SUM(wl.hours_logged), 0) as total_hours
      FROM USERS u
      LEFT JOIN WORK_LOGS wl ON u.id = wl.user_id
      GROUP BY u.id, u.email
      ORDER BY total_hours DESC
    `;
    return await executeQueryRows(sql);
  }

  /**
   * Note: Work logs are immutable per KPI 28
   * No update or delete methods are provided
   */
}

module.exports = WorkLog;
