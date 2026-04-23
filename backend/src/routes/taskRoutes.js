const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks
 * @access  Private
 */
router.get('/', authenticateToken, taskController.getAllTasks);

/**
 * @route   GET /api/tasks/status/:status
 * @desc    Get tasks by status (column)
 * @access  Private
 */
router.get('/status/:status', authenticateToken, taskController.getTasksByStatus);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:id', authenticateToken, taskController.getTaskById);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', authenticateToken, taskController.createTask);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task details
 * @access  Private
 */
router.put('/:id', authenticateToken, taskController.updateTask);

/**
 * @route   PATCH /api/tasks/:id/status
 * @desc    Update task status (drag-and-drop column change)
 * @access  Private
 */
router.patch('/:id/status', authenticateToken, taskController.updateTaskStatus);

/**
 * @route   PATCH /api/tasks/reorder
 * @desc    Reorder tasks within a column
 * @access  Private
 */
router.patch('/reorder', authenticateToken, taskController.reorderTasks);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete('/:id', authenticateToken, taskController.deleteTask);

module.exports = router;