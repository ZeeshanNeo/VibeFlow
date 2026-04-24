const Joi = require('joi');
const Task = require('../models/Task');
const AssignmentHistory = require('../models/AssignmentHistory');
const User = require('../models/User');

// Validation schemas
const assignTaskSchema = Joi.object({
  assigneeId: Joi.number().integer().positive().allow(null).required(),
});

/**
 * Assign/unassign a task to a user
 */
const assignTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Validate request body
    const { error, value } = assignTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { assigneeId } = value;
    const changedBy = req.user.userId || req.user.id;

    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if assignee exists (if assigneeId is provided)
    if (assigneeId !== null) {
      const assignee = await User.findById(assigneeId);
      if (!assignee) {
        return res.status(404).json({ error: 'Assignee not found' });
      }
    }

    // Record assignment change
    await AssignmentHistory.recordChange(
      taskId,
      existingTask.assignee_id,
      assigneeId,
      changedBy
    );

    // Update task assignee
    const updatedTask = await Task.updateAssignee(taskId, assigneeId);

    res.json({
      message: assigneeId ? 'Task assigned successfully' : 'Task unassigned successfully',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment history for a task
 */
const getAssignmentHistory = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get assignment history
    const history = await AssignmentHistory.getByTaskId(taskId);

    res.json({
      task: {
        id: task.id,
        title: task.title,
        currentAssignee: task.assignee_email,
      },
      history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all assignment history (for reporting)
 */
const getAllAssignmentHistory = async (req, res, next) => {
  try {
    const history = await AssignmentHistory.getAll();
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment history for current user
 */
const getMyAssignmentHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const history = await AssignmentHistory.getByUserId(userId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent assignment changes
 */
const getRecentAssignmentChanges = async (req, res, next) => {
  try {
    const history = await AssignmentHistory.getRecent();
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignTask,
  getAssignmentHistory,
  getAllAssignmentHistory,
  getMyAssignmentHistory,
  getRecentAssignmentChanges,
};