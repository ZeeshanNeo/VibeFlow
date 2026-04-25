const { executeQuery, executeQuerySingle, executeQueryRows } = require('../config/database');

class Comment {
  /**
   * Create a new comment
   */
  static async create(taskId, userId, content) {
    const sql = `
      INSERT INTO COMMENTS (task_id, user_id, content)
      VALUES (:taskId, :userId, :content)
      RETURNING id INTO :id
    `;

    const oracledb = require('oracledb');
    const binds = {
      taskId: Number(taskId),
      userId: Number(userId),
      content: content,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await executeQuery(sql, binds);
    const commentId = result.outBinds.id[0];

    return await this.findById(commentId);
  }

  /**
   * Find comment by ID
   */
  static async findById(id) {
    const sql = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM COMMENTS c
      JOIN USERS u ON c.user_id = u.id
      WHERE c.id = :id
    `;
    return await executeQuerySingle(sql, { id });
  }

  /**
   * Get comments for a task
   */
  static async getByTaskId(taskId) {
    const sql = `
      SELECT 
        c.*,
        u.name as user_name,
        u.email as user_email
      FROM COMMENTS c
      JOIN USERS u ON c.user_id = u.id
      WHERE c.task_id = :taskId
      ORDER BY c.created_at DESC
    `;
    return await executeQueryRows(sql, { taskId: Number(taskId) });
  }

  /**
   * Update a comment
   */
  static async update(id, content) {
    const sql = `
      UPDATE COMMENTS
      SET content = :content, updated_at = CURRENT_TIMESTAMP
      WHERE id = :id
    `;
    await executeQuery(sql, { content, id: Number(id) });
    return await this.findById(id);
  }

  /**
   * Delete a comment
   */
  static async delete(id) {
    const sql = 'DELETE FROM COMMENTS WHERE id = :id';
    await executeQuery(sql, { id: Number(id) });
    return true;
  }
}

module.exports = Comment;
