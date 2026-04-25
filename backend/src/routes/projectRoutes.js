const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the authenticated user
 */
router.get('/', projectController.getProjects);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 */
router.post('/', projectController.createProject);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID (members only)
 */
router.get('/:id', projectController.getProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project (admin only)
 */
router.put('/:id', projectController.updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project (owner only)
 */
router.delete('/:id', projectController.deleteProject);

/**
 * @route   GET /api/projects/:id/members
 * @desc    Get project members
 */
router.get('/:id/members', projectController.getMembers);

/**
 * @route   POST /api/projects/:id/members
 * @desc    Add a member to project (admin only)
 */
router.post('/:id/members', projectController.addMember);

/**
 * @route   DELETE /api/projects/:id/members/:userId
 * @desc    Remove a member from project
 */
router.delete('/:id/members/:userId', projectController.removeMember);

module.exports = router;
