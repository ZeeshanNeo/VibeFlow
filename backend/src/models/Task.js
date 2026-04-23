const { executeQuery, executeQuerySingle, executeQueryRows } = require('../config/database');

class Task {
  static normalizeUpdateFields(updates) {
    const fieldMap = {
      title: 'title',
      description: 'description',
      dueDate: 'due_date',
      due_date: 'due_date',
      assigneeId: 'assignee_id',
      assignee_id: 'assignee_id',
    };

    return Object.entries(updates).reduce((acc, [key, value]) => {
      const mappedKey = fieldMap[key];
      if (mappedKey) {
        acc[mappedKey] = value;
      }
      return acc;
    }, {});
  }

  /**
   * Create a new task
   */
  static async create(title, createdBy, assigneeId = null, dueDate = null, status = 'Backlog', description = null) {
    // Get max position in the backlog column
    const maxPosResult = await executeQuerySingle(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM TASKS WHERE status = :status',
      { status }
    );
    // Ensure maxPos is a number (could be null from Oracle)
    const maxPos = maxPosResult?.maxPos !== null && maxPosResult?.maxPos !== undefined ? Number(maxPosResult.maxPos) : 0;
    const position = maxPos + 1;

    console.log('Task.create debug:', { maxPosResult, maxPos, position, status });

    const sql = `
      INSERT INTO TASKS (title, description, status, assignee_id, due_date, created_by, position)
      VALUES (:title, :description, :status, :assigneeId, :dueDate, :createdBy, :position)
      RETURNING id INTO :id
    `;
    
    // Convert undefined to null for Oracle binds, but ensure position is a number
    // Also ensure numeric values are numbers, not strings
    const safeNumber = (val) => {
      if (val == null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    const oracledb = require('oracledb');
    const binds = {
      title: title || null,
      description: description || null,
      status: status || 'Backlog',
      assigneeId: safeNumber(assigneeId),
      dueDate: dueDate || null,
      createdBy: safeNumber(createdBy),
      position: Number(position),
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    // Debug logging
    console.log('Task.create binds:', JSON.stringify(binds, null, 2));
    console.log('Bind types:', {
      assigneeId: typeof binds.assigneeId,
      dueDate: typeof binds.dueDate,
      createdBy: typeof binds.createdBy,
      position: typeof binds.position
    });

    const result = await executeQuery(sql, binds);
    const taskId = result.outBinds.id[0];
    
    // Return the created task
    return await this.findById(taskId);
  }

  /**
   * Find task by ID with join details
   */
  static async findById(id) {
    const sql = `
      SELECT 
        t.*,
        u.email as assignee_email,
        creator.email as created_by_email
      FROM TASKS t
      LEFT JOIN USERS u ON t.assignee_id = u.id
      LEFT JOIN USERS creator ON t.created_by = creator.id
      WHERE t.id = :id
    `;
    return await executeQuerySingle(sql, [id]);
  }

  /**
   * Get all tasks with assignee and creator details
   */
  static async getAll() {
    const sql = `
      SELECT 
        t.*,
        u.email as assignee_email,
        creator.email as created_by_email
      FROM TASKS t
      LEFT JOIN USERS u ON t.assignee_id = u.id
      LEFT JOIN USERS creator ON t.created_by = creator.id
      ORDER BY t.status, t.position
    `;
    return await executeQueryRows(sql);
  }

  /**
   * Get tasks by status (column)
   */
  static async getByStatus(status) {
    const sql = `
      SELECT 
        t.*,
        u.email as assignee_email,
        creator.email as created_by_email
      FROM TASKS t
      LEFT JOIN USERS u ON t.assignee_id = u.id
      LEFT JOIN USERS creator ON t.created_by = creator.id
      WHERE t.status = :status
      ORDER BY t.position
    `;
    return await executeQueryRows(sql, [status]);
  }

  /**
   * Update task status (drag-and-drop column change)
   */
  static async updateStatus(taskId, newStatus) {
    // Get max position in new column
    const maxPosResult = await executeQuerySingle(
      'SELECT COALESCE(MAX(position), 0) as maxPos FROM TASKS WHERE status = :status',
      { status: newStatus }
    );
    // Ensure maxPos is a number (could be null from Oracle)
    const maxPos = maxPosResult?.maxPos !== null && maxPosResult?.maxPos !== undefined ? Number(maxPosResult.maxPos) : 0;
    const newPosition = maxPos + 1;

    const sql = `
      UPDATE TASKS
      SET status = :newStatus, position = :newPosition
      WHERE id = :taskId
    `;
    await executeQuery(sql, { newStatus, newPosition, taskId });
    
    return await this.findById(taskId);
  }

  /**
   * Update task position within same column
   */
  static async updatePosition(taskId, newPosition, status) {
    const safeNumber = (val) => {
      if (val == null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    const sql = `
      UPDATE TASKS
      SET position = :newPosition
      WHERE id = :taskId AND status = :status
    `;
    await executeQuery(sql, { 
      newPosition: safeNumber(newPosition), 
      taskId: safeNumber(taskId), 
      status 
    });
    return await this.findById(taskId);
  }

  /**
   * Update task assignee
   */
  static async updateAssignee(taskId, assigneeId) {
    const safeNumber = (val) => {
      if (val == null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    const sql = 'UPDATE TASKS SET assignee_id = :assigneeId WHERE id = :taskId';
    await executeQuery(sql, { assigneeId: safeNumber(assigneeId), taskId: safeNumber(taskId) });
    return await this.findById(taskId);
  }

  /**
   * Update task details
   */
  static async update(taskId, updates) {
    const normalizedUpdates = this.normalizeUpdateFields(updates);
    const allowedFields = ['title', 'due_date', 'assignee_id', 'description'];
    const setClauses = [];
    const binds = { taskId };
    
    Object.keys(normalizedUpdates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = :${key}`);
        binds[key] = normalizedUpdates[key];
      }
    });
    
    if (setClauses.length === 0) {
      return await this.findById(taskId);
    }
    
    const sql = `UPDATE TASKS SET ${setClauses.join(', ')} WHERE id = :taskId`;
    await executeQuery(sql, binds);
    return await this.findById(taskId);
  }

  /**
   * Delete a task
   */
  static async delete(taskId) {
    const safeNumber = (val) => {
      if (val == null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    const sql = 'DELETE FROM TASKS WHERE id = :taskId';
    await executeQuery(sql, [safeNumber(taskId)]);
    return true;
  }

  /**
   * Reorder tasks in a column after drag-and-drop
   */
  static async reorderColumn(status, taskIdsInOrder) {
    const { executeQuery } = require('../config/database');
    const safeNumber = (val) => {
      if (val == null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    for (let i = 0; i < taskIdsInOrder.length; i++) {
      const taskId = taskIdsInOrder[i];
      await executeQuery(
        'UPDATE TASKS SET position = :position WHERE id = :taskId AND status = :status',
        [i + 1, safeNumber(taskId), status]
      );
    }
    
    return true;
  }
}

module.exports = Task;
