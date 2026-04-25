const Joi = require('joi');
const Task = require('../models/Task');
const AssignmentHistory = require('../models/AssignmentHistory');
const ActivityLog = require('../models/ActivityLog');

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().max(1000).allow('').allow(null).optional(),
  assigneeId: Joi.number().integer().positive().allow(null).default(null),
  dueDate: Joi.date().iso().allow(null).default(null),
  projectId: Joi.number().integer().positive().allow(null).default(null),
  issueType: Joi.string().valid('Epic', 'Story', 'Bug', 'Task', 'Subtask').default('Task'),
  parentId: Joi.number().integer().positive().allow(null).default(null),
  status: Joi.string().valid(
    'Backlog', 'Todo', 'In Progress', 'Review',
    'Testing', 'Done', 'Blocked', 'Archived'
  ).default('Backlog'),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().max(1000).allow('').allow(null).optional(),
  assigneeId: Joi.number().integer().positive().allow(null),
  dueDate: Joi.date().iso().allow(null),
  issueType: Joi.string().valid('Epic', 'Story', 'Bug', 'Task', 'Subtask'),
  parentId: Joi.number().integer().positive().allow(null),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(
    'Backlog', 'Todo', 'In Progress', 'Review',
    'Testing', 'Done', 'Blocked', 'Archived'
  ).required(),
  order: Joi.number().integer().positive().optional(),
});

const reorderSchema = Joi.object({
  taskIds: Joi.array().items(Joi.number().integer().positive()).required(),
  status: Joi.string().valid(
    'Backlog', 'Todo', 'In Progress', 'Review',
    'Testing', 'Done', 'Blocked', 'Archived'
  ).required(),
});

/**
 * Get all tasks
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    let tasks;
    const pId = parseInt(projectId);
    if (projectId && !isNaN(pId)) {
      tasks = await Task.getByProject(pId);
    } else {
      tasks = await Task.getAll();
    }
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task by ID
 */
const getTaskById = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const taskId = parseInt(req.params.id);
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ task });
  } catch (error) {
    next(error);
  }
};

/**
 * Get task activity logs
 */
const getTaskActivity = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const activity = await ActivityLog.getByTaskId(taskId);
    res.json({ activity });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new task
 */
const createTask = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, assigneeId, dueDate, status, description, projectId, issueType, parentId } = value;
    const createdBy = req.user.userId || req.user.id;

    const sanitizedAssigneeId = assigneeId === '' ? null : assigneeId;
    const sanitizedDueDate = dueDate === '' ? null : dueDate;
    const sanitizedProjectId = projectId === '' ? null : projectId;
    const sanitizedParentId = parentId === '' ? null : parentId;

    const task = await Task.create(title, createdBy, sanitizedAssigneeId, sanitizedDueDate, status, description, sanitizedProjectId, issueType || 'Task', sanitizedParentId);
    const tId = task.id || task.ID;

    // Record activity
    await ActivityLog.record(tId, createdBy, 'CREATED', null, title);

    if (sanitizedAssigneeId) {
      await AssignmentHistory.recordChange(tId, null, sanitizedAssigneeId, createdBy);
    }

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task details
 */
const updateTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Validate request body
    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Record assignment change if assignee is being updated
    if (value.assigneeId !== undefined && value.assigneeId !== existingTask.assignee_id) {
      const changerId = req.user.userId || req.user.id;
      await AssignmentHistory.recordChange(
        taskId,
        existingTask.assignee_id,
        value.assigneeId,
        changerId
      );
      await ActivityLog.record(taskId, changerId, 'ASSIGNEE_CHANGE', existingTask.assignee_id, value.assigneeId);
    }

    // Record activity for title/description changes
    const changerId = req.user.userId || req.user.id;
    if (value.title !== undefined && value.title !== existingTask.title) {
      await ActivityLog.record(taskId, changerId, 'TITLE_CHANGE', existingTask.title, value.title);
    }
    if (value.description !== undefined && value.description !== existingTask.description) {
      await ActivityLog.record(taskId, changerId, 'DESCRIPTION_CHANGE', existingTask.description ? 'Description updated' : 'Description added', 'New description');
    }

    // Update task
    const updatedTask = await Task.update(taskId, value);

    res.json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status (drag-and-drop column change)
 */
const updateTaskStatus = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Validate request body
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { status } = value;

    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update status
    const updatedTask = await Task.updateStatus(taskId, status);

    // Record activity
    const userId = req.user.userId || req.user.id;
    if (existingTask.status !== status) {
      await ActivityLog.record(taskId, userId, 'STATUS_CHANGE', existingTask.status, status);
    }

    res.json({
      message: 'Task status updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder tasks within a column
 */
const reorderTasks = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = reorderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { taskIds, status } = value;

    // Reorder tasks in the column
    await Task.reorderColumn(status, taskIds);

    res.json({
      message: 'Tasks reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a task
 */
const deleteTask = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete task
    await Task.delete(taskId);

    res.json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks by status (column)
 */
const getTasksByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    
    // Validate status
    const validStatuses = ['Backlog', 'Todo', 'In Progress', 'Review', 'Testing', 'Done', 'Blocked', 'Archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const tasks = await Task.getByStatus(status);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  getTaskActivity,
  createTask,
  updateTask,
  updateTaskStatus,
  reorderTasks,
  deleteTask,
  getTasksByStatus,
};