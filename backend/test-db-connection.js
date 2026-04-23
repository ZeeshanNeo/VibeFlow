#!/usr/bin/env node

/**
 * Test script to verify database connectivity
 * This is a simplified test that checks configuration
 */

const { connectToDatabase, closePool } = require('./src/config/database');

async function testConnection() {
  console.log('Testing Oracle database connectivity...');
  console.log('Configuration loaded from .env');
  
  try {
    // Try to connect to database
    console.log('Attempting to connect to Oracle database...');
    const pool = await connectToDatabase();
    console.log('✓ Database connection pool created successfully');
    
    // Test a simple query
    console.log('Testing simple query...');
    const result = await pool.getConnection();
    console.log('✓ Database connection established');
    
    // Try to query dual table
    const testResult = await result.execute('SELECT 1 as test FROM dual');
    console.log(`✓ Query executed successfully: ${testResult.rows[0].TEST}`);
    
    await result.close();
    console.log('✓ Connection closed properly');
    
    // Close pool
    await closePool();
    console.log('✓ Connection pool closed');
    
    console.log('\n✅ All database connectivity tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connectivity test failed:');
    console.error(error.message);
    
    if (error.message.includes('ORA-')) {
      console.error('\nOracle error detected. Possible issues:');
      console.error('1. Oracle database not running');
      console.error('2. Incorrect connection credentials');
      console.error('3. Oracle client not installed');
      console.error('4. TNS listener not configured');
    }
    
    console.error('\nFor development, you can:');
    console.error('1. Install Oracle Express Edition (XE)');
    console.error('2. Use Docker: docker run -d -p 1521:1521 -e ORACLE_PASSWORD=oracle gvenzl/oracle-xe:21.3.0');
    console.error('3. Update .env with correct connection details');
    
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testConnection();
}

module.exports = testConnection;