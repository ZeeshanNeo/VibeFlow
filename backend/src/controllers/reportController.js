const { executeQueryRows } = require('../config/database');
const WorkLog = require('../models/WorkLog');

/**
 * Get time report for all tasks
 * Shows each task with Title, Status, Assignee, and Total Hours
 * Includes project grand total
 */
const getTimeReport = async (req, res, next) => {
  try {
    // Use the view created in database/init.sql
    const sql = `
      SELECT 
        id,
        title,
        status,
        assignee_email,
        created_by_email,
        total_hours
      FROM TASK_REPORT_VIEW
      ORDER BY status, title
    `;
    
    const tasks = await executeQueryRows(sql);
    
    // Calculate grand total
    const grandTotal = tasks.reduce((sum, task) => sum + parseFloat(task.total_hours || 0), 0);
    
    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        tasks,
        summary: {
          totalTasks: tasks.length,
          grandTotalHours: grandTotal,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed time report with filtering options
 */
const getDetailedTimeReport = async (req, res, next) => {
  try {
    const { status, assigneeId, startDate, endDate } = req.query;
    
    let sql = `
      SELECT 
        t.id,
        t.title,
        t.status,
        u.email as assignee_email,
        creator.email as created_by_email,
        COALESCE(SUM(wl.hours_logged), 0) as total_hours,
        COUNT(wl.id) as worklog_count
      FROM TASKS t
      LEFT JOIN USERS u ON t.assignee_id = u.id
      LEFT JOIN USERS creator ON t.created_by = creator.id
      LEFT JOIN WORK_LOGS wl ON t.id = wl.task_id
    `;
    
    const conditions = [];
    const binds = {};
    
    if (status) {
      conditions.push('t.status = :status');
      binds.status = status;
    }
    
    if (assigneeId) {
      conditions.push('t.assignee_id = :assigneeId');
      binds.assigneeId = parseInt(assigneeId);
    }
    
    if (startDate) {
      conditions.push('wl.created_at >= TO_DATE(:startDate, \'YYYY-MM-DD\')');
      binds.startDate = startDate;
    }
    
    if (endDate) {
      conditions.push('wl.created_at <= TO_DATE(:endDate, \'YYYY-MM-DD\')');
      binds.endDate = endDate;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY t.id, t.title, t.status, u.email, creator.email ORDER BY t.status, t.title';
    
    const tasks = await executeQueryRows(sql, Object.values(binds));
    
    // Calculate totals
    const grandTotal = tasks.reduce((sum, task) => sum + parseFloat(task.total_hours || 0), 0);
    const totalWorklogs = tasks.reduce((sum, task) => sum + parseInt(task.worklog_count || 0), 0);
    
    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        filters: { status, assigneeId, startDate, endDate },
        tasks,
        summary: {
          totalTasks: tasks.length,
          totalWorklogs,
          grandTotalHours: grandTotal,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project statistics
 */
const getProjectStatistics = async (req, res, next) => {
  try {
    // Task counts by status
    const statusCounts = await executeQueryRows(`
      SELECT status, COUNT(*) as count
      FROM TASKS
      GROUP BY status
      ORDER BY status
    `);
    
    // User statistics
    const userStats = await executeQueryRows(`
      SELECT 
        u.id,
        u.email,
        COUNT(DISTINCT t.id) as assigned_tasks,
        COUNT(DISTINCT t2.id) as created_tasks,
        COALESCE(SUM(wl.hours_logged), 0) as total_hours_logged
      FROM USERS u
      LEFT JOIN TASKS t ON u.id = t.assignee_id
      LEFT JOIN TASKS t2 ON u.id = t2.created_by
      LEFT JOIN WORK_LOGS wl ON u.id = wl.user_id
      GROUP BY u.id, u.email
      ORDER BY u.email
    `);
    
    // Worklog statistics
    const worklogStats = await executeQueryRows(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as log_count,
        SUM(hours_logged) as total_hours
      FROM WORK_LOGS
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `);
    
    // Project totals
    const projectTotalHours = await WorkLog.getProjectTotalHours();
    
    res.json({
      statistics: {
        generatedAt: new Date().toISOString(),
        taskStatusCounts: statusCounts,
        userStatistics: userStats,
        worklogMonthly: worklogStats,
        projectTotals: {
          totalHours: parseFloat(projectTotalHours),
          totalUsers: userStats.length,
          totalTasks: statusCounts.reduce((sum, row) => sum + parseInt(row.count), 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment history report
 */
const getAssignmentReport = async (req, res, next) => {
  try {
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
    
    const history = await executeQueryRows(sql);
    
    // Summary statistics
    const summary = {
      totalChanges: history.length,
      changesByUser: {},
      changesByTask: {},
    };
    
    history.forEach(record => {
      // Count changes by user
      const changer = record.changed_by_email;
      summary.changesByUser[changer] = (summary.changesByUser[changer] || 0) + 1;
      
      // Count changes by task
      const task = record.task_title;
      summary.changesByTask[task] = (summary.changesByTask[task] || 0) + 1;
    });
    
    res.json({
      report: {
        generatedAt: new Date().toISOString(),
        history,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeReport,
  getDetailedTimeReport,
  getProjectStatistics,
  getAssignmentReport,
};