#!/usr/bin/env node

/**
 * Seed script for populating the database with test data
 */

const { connectToDatabase, closePool, executeQuery } = require('./src/config/database');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  console.log('Seeding database with test data...');
  
  let connection;
  try {
    // Connect to database
    const pool = await connectToDatabase();
    connection = await pool.getConnection();
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await connection.execute('DELETE FROM WORK_LOGS');
    await connection.execute('DELETE FROM ASSIGNMENT_HISTORY');
    await connection.execute('DELETE FROM TASKS');
    await connection.execute('DELETE FROM USERS');
    
    // Create users with hashed passwords
    console.log('Creating users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = [
      { email: 'admin@vibeflow.com', password_hash: passwordHash },
      { email: 'john.doe@example.com', password_hash: passwordHash },
      { email: 'jane.smith@example.com', password_hash: passwordHash },
      { email: 'bob.johnson@example.com', password_hash: passwordHash },
      { email: 'alice.williams@example.com', password_hash: passwordHash }
    ];
    
    const userIds = [];
    for (const user of users) {
      const result = await connection.execute(
        `INSERT INTO USERS (email, password_hash) 
         VALUES (:email, :passwordHash)
         RETURNING id INTO :id`,
        {
          email: user.email,
          passwordHash: user.password_hash,
          id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
        }
      );
      userIds.push(result.outBinds.id[0]);
    }
    
    console.log(`Created ${userIds.length} users`);
    
    // Create tasks for each column
    const columns = [
      'Backlog', 'Todo', 'In Progress', 'Review', 'Testing', 'Done', 'Blocked', 'Archived'
    ];
    
    const tasks = [
      { title: 'Implement user authentication', column: 'Backlog', assignee: userIds[0] },
      { title: 'Design database schema', column: 'Backlog', assignee: userIds[1] },
      { title: 'Create Kanban board UI', column: 'Todo', assignee: userIds[2] },
      { title: 'Implement drag-and-drop', column: 'In Progress', assignee: userIds[0] },
      { title: 'Add task creation modal', column: 'In Progress', assignee: userIds[3] },
      { title: 'Write unit tests', column: 'Review', assignee: userIds[1] },
      { title: 'Fix login bug', column: 'Testing', assignee: userIds[4] },
      { title: 'Deploy to staging', column: 'Done', assignee: userIds[0] },
      { title: 'Update documentation', column: 'Blocked', assignee: null },
      { title: 'Archive old tasks', column: 'Archived', assignee: userIds[2] }
    ];
    
    const taskIds = [];
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const position = i + 1;
      
      const result = await connection.execute(
        `INSERT INTO TASKS (title, status, assignee_id, created_by, position) 
         VALUES (:title, :status, :assigneeId, :createdBy, :position)
         RETURNING id INTO :id`,
        {
          title: task.title,
          status: task.column,
          assigneeId: task.assignee,
          createdBy: userIds[0], // admin created all tasks
          position: position,
          id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
        }
      );
      
      const taskId = result.outBinds.id[0];
      taskIds.push(taskId);
      
      // Create assignment history if assignee exists
      if (task.assignee) {
        await connection.execute(
          `INSERT INTO ASSIGNMENT_HISTORY (task_id, old_assignee_id, new_assignee_id, changed_by)
           VALUES (:taskId, NULL, :assigneeId, :changedBy)`,
          {
            taskId: taskId,
            assigneeId: task.assignee,
            changedBy: userIds[0]
          }
        );
      }
    }
    
    console.log(`Created ${taskIds.length} tasks across ${columns.length} columns`);
    
    // Create work logs
    console.log('Creating work logs...');
    const workLogs = [
      { taskId: taskIds[0], userId: userIds[0], hours: 2.5, description: 'Initial research' },
      { taskId: taskIds[0], userId: userIds[0], hours: 1.5, description: 'Implementation' },
      { taskId: taskIds[2], userId: userIds[2], hours: 4.0, description: 'UI design' },
      { taskId: taskIds[3], userId: userIds[0], hours: 3.0, description: 'DnD library integration' },
      { taskId: taskIds[4], userId: userIds[3], hours: 2.0, description: 'Modal component' },
      { taskId: taskIds[5], userId: userIds[1], hours: 1.5, description: 'Test writing' },
      { taskId: taskIds[6], userId: userIds[4], hours: 0.5, description: 'Bug investigation' }
    ];
    
    for (const log of workLogs) {
      await connection.execute(
        `INSERT INTO WORK_LOGS (task_id, user_id, hours_logged, description)
         VALUES (:taskId, :userId, :hours, :description)`,
        {
          taskId: log.taskId,
          userId: log.userId,
          hours: log.hours,
          description: log.description
        }
      );
    }
    
    console.log(`Created ${workLogs.length} work logs`);
    
    // Commit transaction
    await connection.execute('COMMIT');
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('  Email: admin@vibeflow.com');
    console.log('  Password: password123');
    console.log('\nOther users: john.doe@example.com, jane.smith@example.com, etc.');
    console.log('All passwords: password123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    if (connection) {
      await connection.execute('ROLLBACK');
    }
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
    await closePool();
  }
}

// Run seed
if (require.main === module) {
  seedDatabase().catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

module.exports = seedDatabase;