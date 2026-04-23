const express = require('express');
const router = express.Router();
const worklogController = require('../controllers/worklogController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/worklogs/tasks/:id
 * @desc    Create a work log entry for a task
 * @access  Private
 */
router.post('/tasks/:id', authenticateToken, worklogController.createWorkLog);

/**
 * @route   GET /api/worklogs/tasks/:id
 * @desc    Get all work logs for a task
 * @access  Private
 */
router.get('/tasks/:id', authenticateToken, worklogController.getWorkLogsByTask);

/**
 * @route   GET /api/worklogs/my-logs
 * @desc    Get work logs for current user
 * @access  Private
 */
router.get('/my-logs', authenticateToken, worklogController.getMyWorkLogs);

/**
 * @route   GET /api/worklogs/daily-summary
 * @desc    Get work log summary by day
 * @access  Private
 */
router.get('/daily-summary', authenticateToken, worklogController.getDailySummary);

/**
 * @route   GET /api/worklogs/user-summary
 * @desc    Get work log summary by user
 * @access  Private
 */
router.get('/user-summary', authenticateToken, worklogController.getUserSummary);

/**
 * @route   GET /api/worklogs
 * @desc    Get paginated work logs
 * @access  Private
 */
router.get('/', authenticateToken, worklogController.getPaginatedWorkLogs);

/**
 * @route   GET /api/worklogs/project-total
 * @desc    Get project total hours
 * @access  Private
 */
router.get('/project-total', authenticateToken, worklogController.getProjectTotalHours);

module.exports = router;