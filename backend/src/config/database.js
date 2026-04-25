const oracledb = require('oracledb');
require('dotenv').config();

let pool;

const dbConfig = {
  user: process.env.DB_USER || 'system',
  password: process.env.DB_PASSWORD || 'oracle',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XE',
  poolMin: parseInt(process.env.DB_POOL_MIN) || 1,
  poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
  poolIncrement: parseInt(process.env.DB_POOL_INCREMENT) || 1,
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT) || 60,
};

/**
 * Initialize database connection pool
 */
const connectToDatabase = async () => {
  try {
    // Use thin mode to avoid Oracle client dependency
    oracledb.initOracleClient({ driverMode: 'thin' });
    console.log('Oracle client initialized in thin mode');
  } catch (err) {
    console.warn('Oracle client initialization warning:', err.message);
    // If thin mode fails, try without initialization (will use thin mode by default in node-oracledb 6+)
  }

  try {
    pool = await oracledb.createPool(dbConfig);
    console.log('Oracle database connection pool created');
    return pool;
  } catch (error) {
    console.error('Failed to create database connection pool:', error);
    throw error;
  }
};

/**
 * Get a connection from the pool
 */
const getConnection = async () => {
  if (!pool) {
    await connectToDatabase();
  }
  return await pool.getConnection();
};

/**
 * Execute a SQL query with parameters
 */
const executeQuery = async (sql, binds = [], options = {}) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
};

/**
 * Execute a SQL query and return rows
 */
const executeQueryRows = async (sql, binds = []) => {
  const result = await executeQuery(sql, binds);
  return result.rows || [];
};

/**
 * Execute a SQL query and return single row
 */
const executeQuerySingle = async (sql, binds = []) => {
  const rows = await executeQueryRows(sql, binds);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Close the connection pool
 */
const closePool = async () => {
  if (pool) {
    try {
      await pool.close();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing connection pool:', error);
    }
  }
};

module.exports = {
  connectToDatabase,
  getConnection,
  executeQuery,
  executeQueryRows,
  executeQuerySingle,
  closePool,
  dbConfig,
};