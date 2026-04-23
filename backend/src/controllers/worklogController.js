const Joi = require('joi');
const WorkLog = require('../models/WorkLog');
const Task = require('../models/Task');

// Validation schemas
const createWorkLogSchema = Joi.object({
  hoursLogged: Joi.number().positive().required(),
  description: Joi.string().max(1000).required(),
});

/**
 * Create a work log entry for a task
 */
const createWorkLog = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Validate request body
    const { error, value } = createWorkLogSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { hoursLogged, description } = value;
    const userId = req.user.userId;

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Create work log (immutable per KPI 28)
    const workLog = await WorkLog.create(taskId, userId, hoursLogged, description);

    res.status(201).json({
      message: 'Work log created successfully',
      workLog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all work logs for a task
 */
const getWorkLogsByTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get work logs
    const workLogs = await WorkLog.getByTaskId(taskId);
    const totalHours = await WorkLog.getTotalHoursByTask(taskId);

    res.json({
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
      },
      workLogs,
      totalHours: parseFloat(totalHours),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get work logs for current user
 */
const getMyWorkLogs = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const workLogs = await WorkLog.getByUserId(userId);
    
    // Calculate total hours for user
    const totalHours = workLogs.reduce((sum, log) => sum + parseFloat(log.hours_logged), 0);

    res.json({
      workLogs,
      totalHours,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get work log summary by day
 */
const getDailySummary = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const summary = await WorkLog.getDailySummary(days);
    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get work log summary by user
 */
const getUserSummary = async (req, res, next) => {
  try {
    const summary = await WorkLog.getUserSummary();
    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated work logs
 */
const getPaginatedWorkLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const workLogs = await WorkLog.getPaginated(page, limit);
    res.json({ workLogs, page, limit });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project total hours
 */
const getProjectTotalHours = async (req, res, next) => {
  try {
    const totalHours = await WorkLog.getProjectTotalHours();
    res.json({ totalHours: parseFloat(totalHours) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkLog,
  getWorkLogsByTask,
  getMyWorkLogs,
  getDailySummary,
  getUserSummary,
  getPaginatedWorkLogs,
  getProjectTotalHours,
};