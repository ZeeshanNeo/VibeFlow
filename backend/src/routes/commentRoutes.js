const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

router.get('/tasks/:taskId', commentController.getTaskComments);
router.post('/tasks/:taskId', commentController.addComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
