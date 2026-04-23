const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/reports/time
 * @desc    Get time report for all tasks (KPI 30-34)
 * @access  Private
 */
router.get('/time', authenticateToken, reportController.getTimeReport);

/**
 * @route   GET /api/reports/time/detailed
 * @desc    Get detailed time report with filtering
 * @access  Private
 */
router.get('/time/detailed', authenticateToken, reportController.getDetailedTimeReport);

/**
 * @route   GET /api/reports/statistics
 * @desc    Get project statistics
 * @access  Private
 */
router.get('/statistics', authenticateToken, reportController.getProjectStatistics);

/**
 * @route   GET /api/reports/assignments
 * @desc    Get assignment history report
 * @access  Private
 */
router.get('/assignments', authenticateToken, reportController.getAssignmentReport);

module.exports = router;