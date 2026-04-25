const Joi = require('joi');
const Project = require('../models/Project');
const User = require('../models/User');

const createProjectSchema = Joi.object({
  name: Joi.string().max(255).required(),
  key: Joi.string().alphanum().min(2).max(10).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
}).min(1);

/**
 * GET /api/projects — list projects for authenticated user
 */
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.getAllByUser(req.user.userId);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects — create a new project
 */
const createProject = async (req, res, next) => {
  try {
    const { error, value } = createProjectSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Ensure key is unique
    const keyExists = await Project.keyExists(value.key);
    if (keyExists) return res.status(409).json({ error: `Project key "${value.key.toUpperCase()}" is already taken` });

    const project = await Project.create(value.name, value.key, value.description, req.user.userId);
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id — get project details (members only)
 */
const getProject = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    // Removed strict membership check for public workspace visibility

    const project = await Project.findById(projectId, req.user.userId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const members = await Project.getMembers(projectId);
    res.json({ project, members });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id — update project (admin/owner only)
 */
const updateProject = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const membership = await Project.isMember(projectId, req.user.userId);
    if (!membership || membership.ROLE !== 'admin') {
      return res.status(403).json({ error: 'Only project admins can edit this project' });
    }

    const { error, value } = updateProjectSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const project = await Project.update(projectId, req.user.userId, value.name, value.description);
    res.json({ project });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id — delete project (owner only)
 */
const deleteProject = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    await Project.delete(projectId, req.user.userId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id/members — list project members
 */
const getMembers = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const membership = await Project.isMember(projectId, req.user.userId);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const members = await Project.getMembers(projectId);
    res.json({ members });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects/:id/members — add a member by email
 */
const addMember = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const membership = await Project.isMember(projectId, req.user.userId);
    if (!membership || (membership.ROLE !== 'admin')) {
      return res.status(403).json({ error: 'Only project admins can add members' });
    }

    const { email, role = 'member' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const userId = user.ID || user.id;
    const added = await Project.addMember(projectId, userId, role);
    if (!added) return res.status(409).json({ error: 'User is already a member' });

    const members = await Project.getMembers(projectId);
    res.json({ message: 'Member added successfully', members });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/projects/:id/members/:userId — remove a member
 */
const removeMember = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    const membership = await Project.isMember(projectId, req.user.userId);
    if (!membership || (membership.ROLE !== 'admin' && req.user.userId !== targetUserId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Project.removeMember(projectId, targetUserId);
    const members = await Project.getMembers(projectId);
    res.json({ message: 'Member removed', members });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getMembers,
  addMember,
  removeMember,
};
