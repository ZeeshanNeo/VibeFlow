const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const Joi = require('joi');

const commentSchema = Joi.object({
  content: Joi.string().required().max(4000),
});

/**
 * Add a comment to a task
 */
const addComment = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const userId = req.user.userId || req.user.id;
    
    const { error, value } = commentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const comment = await Comment.create(taskId, userId, value.content);
    
    // Record activity
    await ActivityLog.record(taskId, userId, 'COMMENT_ADDED', null, value.content.substring(0, 50) + (value.content.length > 50 ? '...' : ''));

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all comments for a task
 */
const getTaskComments = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const comments = await Comment.getByTaskId(taskId);
    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a comment
 */
const updateComment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.userId || req.user.id;
    
    const { error, value } = commentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check ownership
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this comment' });
    }

    const updatedComment = await Comment.update(id, value.content);
    res.json({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment
 */
const deleteComment = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.userId || req.user.id;

    // Check ownership
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    await Comment.delete(id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addComment,
  getTaskComments,
  updateComment,
  deleteComment,
};
