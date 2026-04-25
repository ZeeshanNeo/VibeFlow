const { executeQuery, executeQuerySingle, executeQueryRows } = require('../config/database');
const oracledb = require('oracledb');

class Project {
  /**
   * Create a new project and add owner as member
   */
  static async create(name, key, description, ownerId) {
    const sql = `
      INSERT INTO PROJECTS (name, key, description, owner_id)
      VALUES (:name, :key, :description, :ownerId)
      RETURNING id INTO :id
    `;
    const binds = {
      name,
      key: key.toUpperCase(),
      description: description || null,
      ownerId,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    };

    const result = await executeQuery(sql, binds);
    const projectId = result.outBinds.id[0];

    // Add owner as admin member
    await executeQuery(
      'INSERT INTO PROJECT_MEMBERS (project_id, user_id, role) VALUES (:projectId, :userId, :role)',
      { projectId, userId: ownerId, role: 'admin' }
    );

    return await this.findById(projectId, ownerId);
  }

  /**
   * Find project by ID
   */
  static async findById(projectId, userId) {
    const sql = `
      SELECT p.*, u.email as owner_email, u.name as owner_name,
        (SELECT COUNT(*) FROM PROJECT_MEMBERS pm2 WHERE pm2.project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM TASKS t WHERE t.project_id = p.id) as task_count,
        pm.role as my_role
      FROM PROJECTS p
      LEFT JOIN USERS u ON p.owner_id = u.id
      LEFT JOIN PROJECT_MEMBERS pm ON pm.project_id = p.id AND pm.user_id = :userId
      WHERE p.id = :projectId
    `;
    return await executeQuerySingle(sql, { projectId, userId });
  }

  /**
   * Get all projects in the system (Workspace view)
   */
  static async getAllByUser(userId) {
    const sql = `
      SELECT p.*, u.email as owner_email, u.name as owner_name,
        (SELECT COUNT(*) FROM PROJECT_MEMBERS pm2 WHERE pm2.project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM TASKS t WHERE t.project_id = p.id) as task_count,
        pm.role as my_role
      FROM PROJECTS p
      LEFT JOIN PROJECT_MEMBERS pm ON pm.project_id = p.id AND pm.user_id = :userId
      LEFT JOIN USERS u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `;
    return await executeQueryRows(sql, { userId });
  }

  /**
   * Update project details (owner only)
   */
  static async update(projectId, ownerId, name, description) {
    const sql = `
      UPDATE PROJECTS SET name = :name, description = :description
      WHERE id = :projectId AND owner_id = :ownerId
    `;
    await executeQuery(sql, { name, description: description || null, projectId, ownerId });
    return await this.findById(projectId, ownerId);
  }

  /**
   * Delete a project (owner only)
   */
  static async delete(projectId, ownerId) {
    const sql = 'DELETE FROM PROJECTS WHERE id = :projectId AND owner_id = :ownerId';
    await executeQuery(sql, { projectId, ownerId });
    return true;
  }

  /**
   * Get members of a project
   */
  static async getMembers(projectId) {
    const sql = `
      SELECT u.id, u.email, u.name, pm.role, pm.joined_at
      FROM PROJECT_MEMBERS pm
      JOIN USERS u ON u.id = pm.user_id
      WHERE pm.project_id = :projectId
      ORDER BY pm.role DESC, u.email
    `;
    return await executeQueryRows(sql, { projectId });
  }

  /**
   * Add a member (admin only)
   */
  static async addMember(projectId, userId, role = 'member') {
    // Check if already a member
    const existing = await executeQuerySingle(
      'SELECT 1 FROM PROJECT_MEMBERS WHERE project_id = :projectId AND user_id = :userId',
      { projectId, userId }
    );
    if (existing) return false;

    await executeQuery(
      'INSERT INTO PROJECT_MEMBERS (project_id, user_id, role) VALUES (:projectId, :userId, :role)',
      { projectId, userId, role }
    );
    return true;
  }

  /**
   * Remove a member
   */
  static async removeMember(projectId, userId) {
    await executeQuery(
      'DELETE FROM PROJECT_MEMBERS WHERE project_id = :projectId AND user_id = :userId',
      { projectId, userId }
    );
    return true;
  }

  /**
   * Check if user is a member
   */
  static async isMember(projectId, userId) {
    const result = await executeQuerySingle(
      'SELECT role FROM PROJECT_MEMBERS WHERE project_id = :projectId AND user_id = :userId',
      { projectId, userId }
    );
    return result || null;
  }

  /**
   * Check if project key already exists
   */
  static async keyExists(key) {
    const result = await executeQuerySingle(
      'SELECT COUNT(*) as cnt FROM PROJECTS WHERE key = :key',
      { key: key.toUpperCase() }
    );
    return (result?.CNT || result?.cnt || 0) > 0;
  }
}

module.exports = Project;
