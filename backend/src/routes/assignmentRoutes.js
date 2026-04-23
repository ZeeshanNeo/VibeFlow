const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   PATCH /api/assignments/tasks/:id/assign
 * @desc    Assign/unassign a task to a user
 * @access  Private
 */
router.patch('/tasks/:id/assign', authenticateToken, assignmentController.assignTask);

/**
 * @route   GET /api/assignments/tasks/:id/history
 * @desc    Get assignment history for a task
 * @access  Private
 */
router.get('/tasks/:id/history', authenticateToken, assignmentController.getAssignmentHistory);

/**
 * @route   GET /api/assignments/history
 * @desc    Get all assignment history (for reporting)
 * @access  Private
 */
router.get('/history', authenticateToken, assignmentController.getAllAssignmentHistory);

/**
 * @route   GET /api/assignments/my-history
 * @desc    Get assignment history for current user
 * @access  Private
 */
router.get('/my-history', authenticateToken, assignmentController.getMyAssignmentHistory);

/**
 * @route   GET /api/assignments/recent
 * @desc    Get recent assignment changes
 * @access  Private
 */
router.get('/recent', authenticateToken, assignmentController.getRecentAssignmentChanges);

module.exports = router;