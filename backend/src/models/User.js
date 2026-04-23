const { executeQuery, executeQuerySingle, executeQueryRows } = require('../config/database');

class User {
  /**
   * Create a new user
   */
  static async create(email, name, passwordHash) {
    const sql = `
      INSERT INTO USERS (email, name, password_hash)
      VALUES (:email, :name, :passwordHash)
      RETURNING id, email, name, created_at INTO :id, :emailOut, :nameOut, :createdAt
    `;
    
    const binds = {
      email,
      name,
      passwordHash,
      id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER },
      emailOut: { dir: require('oracledb').BIND_OUT, type: require('oracledb').STRING },
      nameOut: { dir: require('oracledb').BIND_OUT, type: require('oracledb').STRING },
      createdAt: { dir: require('oracledb').BIND_OUT, type: require('oracledb').DATE }
    };

    const result = await executeQuery(sql, binds);
    const outBinds = result.outBinds || {};

    return {
      id: outBinds.id?.[0],
      email: outBinds.emailOut?.[0] ?? email,
      name: outBinds.nameOut?.[0] ?? name ?? null,
      created_at: outBinds.createdAt?.[0] ?? new Date()
    };
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const sql = 'SELECT * FROM USERS WHERE email = :email';
    return await executeQuerySingle(sql, [email]);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const sql = 'SELECT * FROM USERS WHERE id = :id';
    return await executeQuerySingle(sql, [id]);
  }

  /**
   * Get all users (for assignee dropdown)
   */
  static async getAll() {
    const sql = 'SELECT id, email, name, created_at FROM USERS ORDER BY email';
    return await executeQueryRows(sql);
  }

  /**
   * Update user password
   */
  static async updatePassword(id, passwordHash) {
    const sql = 'UPDATE USERS SET password_hash = :passwordHash WHERE id = :id';
    await executeQuery(sql, [passwordHash, id]);
    return true;
  }

  /**
   * Check if email exists
   */
  static async emailExists(email) {
    const sql = 'SELECT COUNT(*) as count FROM USERS WHERE email = :email';
    const result = await executeQuerySingle(sql, [email]);
    return result.count > 0;
  }
}

module.exports = User;
