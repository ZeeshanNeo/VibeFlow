const Joi = require('joi');
const Task = require('../models/Task');
const AssignmentHistory = require('../models/AssignmentHistory');

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().max(1000).allow('').allow(null).optional(),
  assigneeId: Joi.number().integer().positive().allow(null).default(null),
  dueDate: Joi.date().iso().allow(null).default(null),
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
    const tasks = await Task.getAll();
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
 * Create a new task
 */
const createTask = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, assigneeId, dueDate, status, description } = value;
    const createdBy = req.user.userId;

    // Sanitize assigneeId: empty string -> null
    const sanitizedAssigneeId = assigneeId === '' ? null : assigneeId;
    // Sanitize dueDate: empty string -> null
    const sanitizedDueDate = dueDate === '' ? null : dueDate;

    // Create task
    const task = await Task.create(title, createdBy, sanitizedAssigneeId, sanitizedDueDate, status, description);

    // Record assignment history if assignee is set
    if (sanitizedAssigneeId) {
      await AssignmentHistory.recordChange(task.id, null, sanitizedAssigneeId, createdBy);
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
      await AssignmentHistory.recordChange(
        taskId,
        existingTask.assignee_id,
        value.assigneeId,
        req.user.userId
      );
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
  createTask,
  updateTask,
  updateTaskStatus,
  reorderTasks,
  deleteTask,
  getTasksByStatus,
};